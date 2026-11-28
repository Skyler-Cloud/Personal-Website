"""Exercise ZIP validation, and compile a small multi-file project when TeX is installed."""
import importlib.util, shutil, tempfile, unittest, zipfile
from pathlib import Path
spec=importlib.util.spec_from_file_location("compile_latex",Path(__file__).with_name("compile-latex.py"))
tex=importlib.util.module_from_spec(spec)
spec.loader.exec_module(tex)

class TestLatex(unittest.TestCase):
    def test_zip_safety(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            (root/"out").mkdir()
            with zipfile.ZipFile(root/"bad.zip","w") as z:
                z.writestr("../outside.tex","not safe")
            with self.assertRaises(ValueError):
                tex.unpack(root/"bad.zip",root/"out")
            self.assertFalse((root/"outside.tex").exists())

    @unittest.skipUnless(shutil.which("pandoc"),"Pandoc not installed")
    def test_convert_zip(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            with zipfile.ZipFile(root/"project.zip","w") as z:
                z.writestr("main.tex",r"\documentclass{article}\usepackage{amsthm,amsmath}\newtheorem{theorem}{Theorem}\newcommand{\F}{\mathbb{F}}\begin{document}\section{A section}\begin{theorem}\label{thm:a} For $x\in\F$, $x=x$.\end{theorem}\begin{proof}Trivial.\end{proof}\input{part}\end{document}")
                z.writestr("part.tex",r"See Theorem~\ref{thm:a}. \[x^2=x\cdot x\]")
            tex.convert_job(root,root/"out",root/"fragments",{"id":"test","source":"project.zip"})
            html=(root/"fragments/test.html").read_text()
            self.assertIn("<math",html)
            self.assertIn("Theorem 1",html)
            self.assertIn("Proof.",html)
            self.assertIn('href="#tex-test-thm:a"',html)
            self.assertIn("<h2",html)
            self.assertNotIn("<iframe",html)

    @unittest.skipUnless(shutil.which("latexmk") and shutil.which("pdflatex"),"TeX not installed")
    def test_compile_zip_and_tex(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)
            source=r"\documentclass{article}\begin{document}Test $x^2$.\end{document}"
            (root/"single.tex").write_text(source)
            with zipfile.ZipFile(root/"project.zip","w") as z:
                z.writestr("main.tex",r"\documentclass{article}\begin{document}\input{part}\end{document}")
                z.writestr("part.tex","Test $x^2$.")
            for job in [{"id":"single","source":"single.tex","engine":"pdflatex"},{"id":"project","source":"project.zip","engine":"pdflatex"}]:
                tex.compile_job(root,root/"out",job)
                self.assertTrue((root/"out"/(job["id"]+".pdf")).read_bytes().startswith(b"%PDF-"))

if __name__=="__main__":
    unittest.main()
