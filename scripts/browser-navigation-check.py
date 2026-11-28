"""Browser regression checks against the actual built static site, not the offline mock."""
import os
import tempfile
import threading
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

base = "/" + os.environ.get("BASE_PATH", "/Personal-Website/").strip("/")
if base != "/":
    base += "/"
dist = Path("apps/web/dist").resolve()

with tempfile.TemporaryDirectory() as temp:
    directory = str(dist) if base == "/" else temp
    if base != "/":
        mount = Path(temp) / base.strip("/")
        mount.parent.mkdir(parents=True, exist_ok=True)
        mount.symlink_to(dist, target_is_directory=True)
    server = ThreadingHTTPServer(("127.0.0.1", 0), partial(SimpleHTTPRequestHandler, directory=directory))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    url = f"http://127.0.0.1:{server.server_port}{base}"
    try:
        with sync_playwright() as pw:
            for engine in (pw.chromium, pw.webkit):
                with engine.launch() as browser:
                    page = browser.new_page(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True, reduced_motion="reduce")
                    errors = []
                    page.on("pageerror", lambda e: errors.append(str(e)))
                    page.goto(url)
                    page.wait_for_load_state("networkidle")
                    page.evaluate("window.__navigationTest = 42")
                    def navigate(label, path, scope=None):
                        link = (scope or page).get_by_role("link", name=label, exact=True).first
                        link.click()
                        expect(page).to_have_url(url + path)
                        page.wait_for_function("document.readyState === 'complete' && !document.documentElement.hasAttribute('data-astro-transition')")
                        assert page.evaluate("window.__navigationTest") == 42, "Unexpected full reload"
                    nav = page.get_by_role("navigation", name="Website section")
                    navigate("Personal", "personal/", nav)
                    expect(page.locator("html")).to_have_attribute("data-mode", "personal")
                    assert page.locator(".home-layout").evaluate("(el)=>getComputedStyle(el).gridTemplateColumns.split(' ').length") == 1
                    assert page.locator("h1").evaluate("(el)=>parseFloat(getComputedStyle(el).fontSize)") <= 38
                    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
                    page.set_viewport_size({"width": 1280, "height": 900})
                    assert page.locator(".home-layout").evaluate("(el)=>getComputedStyle(el).gridTemplateColumns.split(' ').length") == 2
                    assert page.locator(".home-profile").bounding_box()["x"] < page.locator(".home-content").bounding_box()["x"]
                    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
                    page.set_viewport_size({"width":390,"height":844})
                    navigate("View gallery →", "personal/gallery/")
                    page.locator("[data-filter='artwork']").click()
                    assert page.locator(".gallery-item:not([hidden])").count() > 0
                    assert page.locator(".gallery-item:not([hidden])[data-category='photography']").count() == 0
                    navigate("Academic", "academic/", page.get_by_role("navigation", name="Website section"))
                    expect(page.locator("html")).to_have_attribute("data-mode", "academic")
                    navigate("All writing →", "academic/writing/")
                    page.locator("[data-filter='technical']").click()
                    expect(page.locator("[data-view='technical']")).to_be_visible()
                    expect(page.locator("[data-view='all']")).to_be_hidden()
                    navigate("A note on zero-knowledge proofs", "academic/writing/zero-knowledge/", page.locator("[data-view='technical']"))
                    expect(page.locator(".katex").first).to_be_visible()
                    expect(page.locator("link[href$='vendor/katex/katex.min.css']")).to_have_count(1)
                    page.evaluate("document.fonts.ready")
                    assert page.evaluate("document.fonts.check('16px KaTeX_Main')")
                    page.go_back()
                    expect(page).to_have_url(url + "academic/writing/")
                    expect(page.locator("html")).to_have_attribute("data-mode", "academic")
                    page.go_forward()
                    expect(page).to_have_url(url + "academic/writing/zero-knowledge/")
                    assert page.evaluate("window.__navigationTest") == 42
                    navigate("Personal", "personal/writing/", page.get_by_role("navigation", name="Website section"))
                    expect(page.locator("html")).to_have_attribute("data-mode", "personal")
                    expect(page.locator("link[href$='vendor/katex/katex.min.css']")).to_have_count(0)
                    # WebKit rejects ViewTransition.ready when Astro deliberately calls
                    # skipTransition() for reduced motion. Navigation has already been
                    # asserted above; reject every other browser error.
                    expected_abort = "AbortError: Skipping view transition because skipTransition() was called."
                    unexpected = [e for e in errors if not (engine.name == "webkit" and e == expected_abort)]
                    if len(unexpected) != len(errors):
                        print("WebKit reported the expected reduced-motion transition abort")
                    assert not unexpected, unexpected
                    page.close()
                    plain = browser.new_page(java_script_enabled=False)
                    plain.goto(url)
                    plain.get_by_role("navigation", name="Website section").get_by_role("link", name="Personal", exact=True).click()
                    expect(plain).to_have_url(url + "personal/")
                    expect(plain.locator("html")).to_have_attribute("data-mode", "personal")
                    plain.close()
                    print(engine.name + ": routing, history, filters, math and no-JS navigation passed")
    finally:
        server.shutdown()
