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
