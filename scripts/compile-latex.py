"""Compile trusted author-owned TeX with no shell escape and bounded archive extraction."""
import json, os, re, shutil, stat, subprocess, sys, tempfile, zipfile
from pathlib import Path, PurePosixPath

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

def compile_job(source_dir, output_dir, job):
    source=source_dir/job["source"]
    with tempfile.TemporaryDirectory(prefix="site-tex-") as tmp:
        work=Path(tmp)
        unpack(source,work)
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
        if not main.is_file():
            raise ValueError("Missing main TeX file: "+str(main))
        env={**os.environ,"openin_any":"p","openout_any":"p"}
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

if __name__=="__main__":
    for job in json.load(sys.stdin):
        compile_job(Path(sys.argv[1]),Path(sys.argv[2]),job)
