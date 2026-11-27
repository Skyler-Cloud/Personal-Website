from playwright.sync_api import sync_playwright
from pathlib import Path
import os

# Uses an in-memory document because the authoring environment blocks URL navigation.
# Tests the standalone preview, not the production Astro output.
html = Path('preview-output/preview.html').read_text()
with sync_playwright() as w:
    browser = w.chromium.launch(executable_path=os.environ.get('CHROMIUM','/usr/bin/chromium'), headless=True, args=['--no-sandbox'])
    page = browser.new_page(viewport={'width':390,'height':844}, color_scheme='light')
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.set_content(html, wait_until='domcontentloaded')
    assert page.get_by_role('heading',name='your name').is_visible()
    assert page.locator('html').evaluate('(e)=>e.scrollWidth') <= 390
    page.get_by_role('navigation',name='Website section').get_by_role('link',name='Personal').click()
    assert page.locator('html').get_attribute('data-mode') == 'personal'
    page.get_by_role('link',name='All writing →').click()
    page.get_by_role('heading',name='writing',exact=True).wait_for()
    page.get_by_role('button',name='Reviews').click()
    assert page.locator('[data-view="review"]').is_visible()
    assert page.locator('[data-view="all"]').is_hidden()
    assert page.locator('[data-view="review"]').get_by_text('4.5 / 5',exact=False).is_visible()
    page.locator('[data-view="review"]').get_by_role('link',name='A story I keep thinking about').click()
    page.locator('.rating-wash').wait_for()
    page.get_by_role('link',name='Gallery',exact=True).click()
    assert page.locator('html').get_attribute('data-mode') == 'personal'
    page.get_by_role('button',name='Artwork').click()
    assert page.locator('.gallery-item:visible').count() == 3
    page.locator('.gallery-item:visible a').first.click()
    page.locator('.art-detail img').wait_for()
    page.get_by_role('link',name='Writing',exact=True).click()
    page.locator('[data-view="all"]').get_by_role('link',name='An ordinary afternoon').click()
    assert page.locator('.summary-wash').count() == 0
    assert page.locator('.rating-wash').count() == 0
    page.get_by_role('link',name='Home',exact=True).click()
    page.set_viewport_size({'width':1280,'height':900})
    assert page.locator('html').evaluate('(e)=>e.scrollWidth') <= 1280
    assert not errors, errors
    print('Browser preview checks passed: navigation, filters, academic/personal modes, gallery, empty properties, mobile and desktop widths.')
    browser.close()
