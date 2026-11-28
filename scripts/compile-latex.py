"""Compile trusted author-owned TeX with no shell escape and bounded archive extraction."""
import json, os, re, shutil, stat, subprocess, sys, tempfile, zipfile
from pathlib import Path, PurePosixPath
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import hashlib

MAX_FILES=500
MAX_BYTES=100*1024*1024

def unpack(source, target):
    if source.suffix==".tex":
        shutil.copyfile(source,target/source.name)
        return
    with zipfile.ZipFile(source) as archive:
        entries=archive.infolist()
        if len(entries)>MAX_FILES or sum(e.file_size for e in entries)>MAX_BYTES:
            raise ValueError("LaTeX ZIP exceeds size or file-count limit")
        seen=set()
        for entry in entries:
            p=PurePosixPath(entry.filename)
            mode=entry.external_attr >> 16
            if p.is_absolute() or not p.parts or ".." in p.parts or "\\" in entry.filename or ":" in entry.filename or stat.S_ISLNK(mode) or (stat.S_IFMT(mode) not in (0,stat.S_IFREG,stat.S_IFDIR)):
                raise ValueError("Unsafe ZIP entry: "+entry.filename)
            if p in seen:
                raise ValueError("Duplicate ZIP entry: "+entry.filename)
            seen.add(p)
            out=target.joinpath(*p.parts)
            if entry.is_dir():
                out.mkdir(parents=True,exist_ok=True)
            else:
                out.parent.mkdir(parents=True,exist_ok=True)
                with archive.open(entry) as src, out.open("xb") as dest:
                    shutil.copyfileobj(src,dest)

def select_main(source, work, job):
    if source.suffix==".tex":
        main=work/source.name
    elif job.get("main"):
        main=work/job["main"]
    else:
        choices=[p for p in work.rglob("*.tex") if p.name=="main.tex"]
        if len(choices)!=1:
            choices=[p for p in work.rglob("*.tex") if re.search(rb"\\documentclass\b",p.read_bytes())]
        if len(choices)!=1:
            raise ValueError("Ambiguous main TeX file; set latexMain in article properties")
        main=choices[0]
    if main.name.startswith("-") or not main.is_file():
        raise ValueError("Missing main TeX file: "+str(main))
    return main

def compile_job(source_dir, output_dir, job):
    source=source_dir/job["source"]
    with tempfile.TemporaryDirectory(prefix="site-tex-") as tmp:
        work=Path(tmp)
        unpack(source,work)
        main=select_main(source,work,job)
        env={k:os.environ[k] for k in ("PATH","LANG","LC_ALL","SYSTEMROOT") if k in os.environ}
        env.update({"HOME":str(work),"openin_any":"p","openout_any":"p"})
        engine={"pdflatex":"-pdf","xelatex":"-xelatex","lualatex":"-lualatex"}[job["engine"]]
        # -norc prevents project latexmkrc execution. Shell escape is explicitly disabled.
        command=["latexmk","-norc",engine,"-interaction=nonstopmode","-halt-on-error","-no-shell-escape","-jobname=website-output",main.name]
        result=subprocess.run(command,cwd=main.parent,env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,timeout=120)
        pdf=main.parent/"website-output.pdf"
        if result.returncode or not pdf.is_file() or not pdf.read_bytes().startswith(b"%PDF-"):
            raise RuntimeError("TeX failed for "+job["id"]+"\n"+result.stdout.decode(errors="replace")[-12000:])
        output_dir.mkdir(parents=True,exist_ok=True)
        shutil.copyfile(pdf,output_dir/(job["id"]+".pdf"))
        print("Compiled "+job["id"])

# Pandoc emits a fragment, not a standalone page. Preserve math and semantic
# markup while allowing only inert elements and controlled URL attributes.
class Fragment(HTMLParser):
    tags=set("p div span h1 h2 h3 h4 h5 h6 a img figure figcaption ul ol li dl dt dd blockquote pre code em strong b i u s del sup sub small hr br table caption colgroup col thead tbody tfoot tr th td section nav math semantics annotation mrow mi mn mo mtext mspace ms mfrac msqrt mroot mstyle merror mpadded mphantom mfenced menclose msub msup msubsup munder mover munderover mmultiscripts mprescripts none mtable mtr mtd maligngroup malignmark".split())
    void=set("img hr br col".split())
    attrs=set("id class title alt role colspan rowspan scope start reversed type width height align xmlns display encoding mathvariant mathsize mathcolor mathbackground stretchy symmetric fence separator lspace rspace accent accentunder form largeop movablelimits minsize maxsize linethickness bevelled notation rowalign columnalign columnspacing rowspacing columnspan rowspan scriptlevel displaystyle depth voffset".split())
    def __init__(self, work, main, output, slug):
        super().__init__(convert_charrefs=True)
        self.work=work.resolve()
        self.main=main.parent
        self.output=output
        self.slug=slug
        self.parts=[]
    def image(self,value):
        parsed=urlsplit(value)
        if parsed.scheme or parsed.netloc or parsed.query or parsed.fragment:
            raise ValueError("Only local project images supported: "+value)
        source=(self.main/unquote(parsed.path)).resolve()
        if not source.is_relative_to(self.work) or not source.is_file():
            raise ValueError("Missing or unsafe project image: "+value)
        suffix=source.suffix.lower()
        if suffix not in (".png",".jpg",".jpeg",".gif",".webp",".svg",".pdf"):
            raise ValueError("Unsupported project image: "+value)
        name=hashlib.sha256(str(source.relative_to(self.work)).encode()).hexdigest()[:16]
        self.output.mkdir(parents=True,exist_ok=True)
        if suffix==".pdf":
            dest=self.output/(name+".png")
            subprocess.run(["pdftocairo","-png","-singlefile","-f","1","-l","1","-r","144",str(source),str(dest.with_suffix(""))],check=True,timeout=60)
        else:
            dest=self.output/(name+suffix)
            shutil.copyfile(source,dest)
        return "assets/latex/"+self.slug+"/"+dest.name
    def handle_starttag(self,tag,attrs):
        if tag not in self.tags:
            raise ValueError("Unsupported converted HTML element: "+tag)
        result=[]
        for key,value in attrs:
            if value is None: continue
            if key=="src" and tag=="img":
                value=self.image(value)
            elif key=="href" and tag=="a":
                url=urlsplit(value)
                if value.startswith("#") and len(value)>1:
                    value="#tex-"+self.slug+"-"+value[1:]
                elif url.scheme not in ("https","http","mailto"):
                    raise ValueError("Unsupported converted link: "+value)
            elif key=="id":
                value="tex-"+self.slug+"-"+value
            elif key not in self.attrs and not key.startswith("aria-") and key not in ("data-reference","data-reference-type","data-cites"):
                continue
            result.append(" "+key+'="'+escape(value,quote=True)+'"')
        self.parts.append("<"+tag+"".join(result)+">")
    def handle_startendtag(self,tag,attrs):
        self.handle_starttag(tag,attrs)
        if tag not in self.void:self.handle_endtag(tag)
    def handle_endtag(self,tag):
        if tag not in self.tags:raise ValueError("Unsupported converted HTML element: "+tag)
        if tag not in self.void:self.parts.append("</"+tag+">")
    def handle_data(self,data):
        self.parts.append(escape(data,quote=False))

def convert_job(source_dir, output_dir, fragments, job):
    source=source_dir/job["source"]
    with tempfile.TemporaryDirectory(prefix="site-tex-html-") as tmp:
        work=Path(tmp)
        unpack(source,work)
        main=select_main(source,work,job)
        env={k:os.environ[k] for k in ("PATH","LANG","LC_ALL","SYSTEMROOT") if k in os.environ}
        env["HOME"]=str(work)
        cmd=["pandoc","--from=latex-raw_tex","--to=html5","--mathml","--citeproc","--shift-heading-level-by=1","--fail-if-warnings",main.name]
        run=subprocess.run(cmd,cwd=main.parent,env=env,capture_output=True,timeout=120)
        if run.returncode:
            raise RuntimeError("LaTeX HTML conversion failed for "+job["id"]+"\n"+run.stderr.decode(errors="replace")[-12000:])
        parser=Fragment(work,main,output_dir/job["id"],job["id"])
        parser.feed(run.stdout.decode("utf-8"))
        parser.close()
        body="".join(parser.parts)
        if not body.strip():raise ValueError("Empty converted document: "+job["id"])
        fragments.mkdir(parents=True,exist_ok=True)
        (fragments/(job["id"]+".html")).write_text(body,encoding="utf-8")
        print("Converted "+job["id"]+" to HTML")

if __name__=="__main__":
    for job in json.load(sys.stdin):
        convert_job(Path(sys.argv[1]),Path(sys.argv[2]),Path(sys.argv[3]),job)
        if job.get("pdf"):compile_job(Path(sys.argv[1]),Path(sys.argv[2]),job)
