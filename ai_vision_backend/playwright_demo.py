from playwright.sync_api import sync_playwright
import time
import os

FRONTEND_URL = "http://localhost:3000"
TEST_IMAGE = r"E:\AI VISION LAB\ai\public\obb_ttest.jpeg"
OUTPUT_DIR = r"E:\AI VISION LAB\ai_vision_backend\playwright_output"

os.makedirs(OUTPUT_DIR, exist_ok=True)

console_messages = []

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    context = browser.new_context()

    # Capture console messages
    def on_console(msg):
        console_messages.append(f"{msg.type}: {msg.text}")

    context.on("console", on_console)

    page = context.new_page()
    print("Navigating to frontend...", FRONTEND_URL)
    page.goto(FRONTEND_URL)

    # Wait for the page to be interactive
    page.wait_for_selector("text=OBJECT DETECTION", timeout=10000)
    print("Navigated to main page")

    # Click on Object Detection feature link
    page.click("text=Object Detection")
    page.wait_for_selector("text=INPUT", timeout=5000)
    print("On Object Detection page")

    # Ensure session initialized by checking for Upload Image button
    page.wait_for_selector("text=Upload Image", timeout=5000)

    # Upload the file using the hidden input[type=file]
    file_input = page.query_selector('input[type="file"]')
    if not file_input:
        raise SystemExit('File input not found')

    print('Uploading file:', TEST_IMAGE)
    file_input.set_input_files(TEST_IMAGE)

    # Wait for processing status to change to completed or timeout
    print('Waiting for processing result...')
    # Poll for the result image to appear
    try:
        page.wait_for_selector('img[alt="Processed result"]', timeout=30000)
        print('Result image appeared')
    except Exception as e:
        print('Timeout waiting for result image:', str(e))

    # Save screenshot
    screenshot_path = os.path.join(OUTPUT_DIR, 'result_screenshot.png')
    page.screenshot(path=screenshot_path, full_page=True)
    print('Saved screenshot to', screenshot_path)

    # Save console messages
    with open(os.path.join(OUTPUT_DIR, 'console.log'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(console_messages))

    print('Console messages saved to:', os.path.join(OUTPUT_DIR, 'console.log'))

    browser.close()

print('Playwright run finished')
