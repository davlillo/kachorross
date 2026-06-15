"""Generate placeholder screenshots for the interactive user manual.
These are temporary placeholders until real screenshots are captured via Playwright.

Usage: python scripts/generate_placeholder_screenshots.py
"""

from PIL import Image, ImageDraw, ImageFont
import os

SCREENSHOTS = {
    "dashboard.png": ("Dashboard", "#e8f4f8", "Panel principal con estadisticas, graficos y accesos rapidos"),
    "expedientes.png": ("Expedientes", "#fff0e6", "Listado de expedientes clinicos con busqueda y filtros"),
    "expediente-detalle.png": ("Expediente - Detalle", "#e8f5e9", "Vista detallada del expediente con datos del paciente, consultas y evolucion"),
    "consulta-nueva.png": ("Nueva Consulta", "#fce4ec", "Formulario para crear una nueva consulta medica"),
    "recepcion.png": ("Recepcion", "#f3e5f5", "Monitor de salida y gestion de pacientes en recepcion"),
    "catalogo.png": ("Catalogo", "#e0f2f1", "Gestion de productos y servicios del catalogo veterinario"),
    "historial-ventas.png": ("Historial de Ventas", "#fff9c4", "Registro historico de ventas y transacciones"),
}

WIDTH, HEIGHT = 1440, 900


def create_placeholder(filename: str, title: str, bg_hex: str, description: str):
    """Create a placeholder screenshot with title and description."""
    img = Image.new("RGB", (WIDTH, HEIGHT), bg_hex)
    draw = ImageDraw.Draw(img)

    # Try to use a nice font, fall back to default
    try:
        title_font = ImageFont.truetype("C:\\Windows\\Fonts\\segoeui.ttf", 48)
        desc_font = ImageFont.truetype("C:\\Windows\\Fonts\\segoeui.ttf", 22)
        small_font = ImageFont.truetype("C:\\Windows\\Fonts\\segoeui.ttf", 16)
    except OSError:
        title_font = ImageFont.load_default()
        desc_font = ImageFont.load_default()
        small_font = ImageFont.load_default()

    # Draw a subtle border
    draw.rectangle([0, 0, WIDTH - 1, HEIGHT - 1], outline="#cccccc", width=2)

    # Center the title
    title_bbox = draw.textbbox((0, 0), title, font=title_font)
    title_w = title_bbox[2] - title_bbox[0]
    title_x = (WIDTH - title_w) // 2
    title_y = HEIGHT // 2 - 60
    draw.text((title_x, title_y), title, fill="#333333", font=title_font)

    # Description below title
    desc_bbox = draw.textbbox((0, 0), description, font=desc_font)
    desc_w = desc_bbox[2] - desc_bbox[0]
    desc_x = (WIDTH - desc_w) // 2
    desc_y = HEIGHT // 2 + 10
    draw.text((desc_x, desc_y), description, fill="#666666", font=desc_font)

    # "Placeholder" watermark
    watermark = "[ Placeholder - Capturar con Playwright ]"
    wm_bbox = draw.textbbox((0, 0), watermark, font=small_font)
    wm_w = wm_bbox[2] - wm_bbox[0]
    wm_x = (WIDTH - wm_w) // 2
    wm_y = HEIGHT - 50
    draw.text((wm_x, wm_y), watermark, fill="#999999", font=small_font)

    img.save(filename)
    print(f"  {filename} ({WIDTH}x{HEIGHT})")


def main():
    out_dir = "public/screenshots"
    os.makedirs(out_dir, exist_ok=True)

    for filename, (title, bg, desc) in SCREENSHOTS.items():
        path = os.path.join(out_dir, filename)
        create_placeholder(path, title, bg, desc)

    print(f"\n7 placeholder screenshots created in {out_dir}/")
    print("Run 'python scripts/capture_manual_screenshots.py' to replace with real captures.")


if __name__ == "__main__":
    main()
