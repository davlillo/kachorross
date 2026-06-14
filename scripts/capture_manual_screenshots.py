"""Capture 1440×900 screenshots for the interactive user manual.

Usage:
  python scripts/capture_manual_screenshots.py

Requirements:
  - Dev server running: npm run dev (port 5173)
  - playwright: pip install playwright && playwright install chromium
  - Valid credentials in the Supabase instance
"""

from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

SCREENSHOTS = [
    ("/dashboard", "dashboard.png"),
    ("/expedientes", "expedientes.png"),
    ("/expedientes/1", "expediente-detalle.png"),
    ("/consulta/nueva", "consulta-nueva.png"),
    ("/recepcion", "recepcion.png"),
    ("/admin/catalogo", "catalogo.png"),
    ("/historial-ventas", "historial-ventas.png"),
]

VIEWPORT = {"width": 1440, "height": 900}
BASE_URL = "http://localhost:5173"

# -- Cambia estas credenciales por unas validas en tu Supabase --
EMAIL = "admin@kachorros.com"
PASSWORD = "123456"


def login(page):
    """Log in and return True if successful."""
    print(f"[login] Navegando a {BASE_URL}/login ...")
    page.goto(f"{BASE_URL}/login")
    page.wait_for_load_state("networkidle")

    print(f"[login] Ingresando credenciales: {EMAIL}")
    page.fill('input[type="email"]', EMAIL)
    page.fill('input[type="password"]', PASSWORD)
    page.click('button[type="submit"]')

    # Strategy 1: wait for sidebar to appear (more reliable than URL)
    try:
        page.wait_for_selector("aside nav", timeout=15000)
        print("[login] OK - Sidebar detectado, sesion iniciada.")
        return True
    except PlaywrightTimeout:
        print("[login] Sidebar no detectado en 15s, buscando error...")

    # Strategy 2: check if an error alert appeared (wrong credentials)
    try:
        error_el = page.wait_for_selector('[role="alert"]', timeout=3000)
        error_text = error_el.inner_text() if error_el else "(sin texto)"
        print(f"[login] ERROR detectado: {error_text}")
    except PlaywrightTimeout:
        print("[login] Sin alerta de error visible.")

    # Strategy 3: try direct navigation (maybe login succeeded without redirect)
    print(f"[login] Intentando navegacion directa a {BASE_URL}/dashboard ...")
    page.goto(f"{BASE_URL}/dashboard")
    page.wait_for_load_state("networkidle")
    try:
        page.wait_for_selector("aside nav", timeout=5000)
        print("[login] OK - Navegacion directa exitosa.")
        return True
    except PlaywrightTimeout:
        print("[login] FALLO - Navegacion directa tambien fallo.")
        print("[login] Posibles causas: credenciales invalidas, Supabase offline, o auth flow cambiado.")
        return False


def capture():
    import os

    out_dir = "public/screenshots"
    os.makedirs(out_dir, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport=VIEWPORT)

        if not login(page):
            print("\n*** ERROR: No se pudo iniciar sesion. Verifica que:")
            print("   1. El servidor este corriendo: npm run dev")
            print("   2. Las credenciales en EMAIL/PASSWORD sean validas en Supabase")
            print("   3. Supabase este accesible")
            browser.close()
            return

        for route, filename in SCREENSHOTS:
            url = f"{BASE_URL}{route}"
            print(f"\n[capture] {url} -> {out_dir}/{filename}")
            page.goto(url)
            page.wait_for_load_state("networkidle")
            # Small extra wait for animations / lazy images
            page.wait_for_timeout(1000)
            page.screenshot(path=f"{out_dir}/{filename}", full_page=False)
            size = os.path.getsize(f"{out_dir}/{filename}")
            print(f"  OK - {size} bytes")

        browser.close()
        print("\n*** Todas las capturas guardadas en public/screenshots/ ***")


if __name__ == "__main__":
    capture()
