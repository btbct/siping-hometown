# -*- coding: utf-8 -*-
"""用站内图片生成一段 20 秒的家乡宣传短片（图片轮播 + 缓慢推近 + 字幕）。"""
import os
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, "assets", "img")
OUT_DIR = os.path.join(ROOT, "assets", "video")
os.makedirs(OUT_DIR, exist_ok=True)
OUT = os.path.join(OUT_DIR, "siping-promo.mp4")

W, H = 1280, 720
FPS = 20
PER = 2.5  # 每张 2.5 秒

SLIDES = [
    ("hero.jpg", "吉林 · 四平", "英雄之城 · 满韵之乡 · 湖山秀色"),
    ("cat-red.jpg", "红色记忆", "四平战役纪念馆 · 塔子山战斗遗址"),
    ("cat-man.jpg", "满族风情", "叶赫那拉城 · 满族服饰与民俗"),
    ("cat-lake.jpg", "湖山自然", "二龙湖 · 转山湖 · 松辽平原"),
    ("culture-01.jpg", "人文古迹", "偏脸城 · 伊斯兰教清真寺"),
    ("food-01.jpg", "四平味道", "熏肉大饼 · 满族火锅 · 黏豆包"),
    ("season-01.jpg", "四季四平", "春赏花 · 夏避暑 · 秋斑斓 · 冬戏雪"),
    ("cat-life.jpg", "城市烟火", "夜市灯笼 · 早市热气 · 东北人情"),
]

# 字体：优先微软雅黑，其次黑体
FONT_CAND = ["C:/Windows/Fonts/msyh.ttc", "C:/Windows/Fonts/msyhbd.ttc",
             "C:/Windows/Fonts/simhei.ttf", "C:/Windows/Fonts/simsun.ttc"]
FONT_PATH = next((p for p in FONT_CAND if os.path.exists(p)), None)
f_title = ImageFont.truetype(FONT_PATH, 62) if FONT_PATH else ImageFont.load_default()
f_sub = ImageFont.truetype(FONT_PATH, 30) if FONT_PATH else ImageFont.load_default()


def cover(path):
    im = Image.open(path).convert("RGB")
    sw, sh = im.size
    scale = max(W / sw, H / sh)
    nw, nh = int(sw * scale), int(sh * scale)
    im = im.resize((nw, nh), Image.LANCZOS)
    left, top = (nw - W) // 2, (nh - H) // 2
    return im.crop((left, top, left + W, top + H))


def frame(base, k, n, title, sub):
    """k: 当前帧序号, n: 本张总帧数 —— 缓慢推近"""
    z = 1.0 + 0.08 * (k / max(n - 1, 1))
    nw, nh = int(W * z), int(H * z)
    im = base.resize((nw, nh), Image.LANCZOS)
    im = im.crop(((nw - W) // 2, (nh - H) // 2, (nw - W) // 2 + W, (nh - H) // 2 + H))

    # 底部渐变压暗，保证字幕可读
    grad = Image.new("L", (1, H), 0)
    for y in range(H):
        grad.putpixel((0, y), int(max(0, min(255, (y - H * 0.55) / (H * 0.45) * 210))))
    dark = Image.new("RGB", (W, H), (6, 9, 18))
    im = Image.composite(dark, im, grad.resize((W, H)))

    d = ImageDraw.Draw(im)
    # 标题带描边阴影
    x, y = 84, H - 190
    d.text((x + 3, y + 3), title, font=f_title, fill=(0, 0, 0))
    d.text((x, y), title, font=f_title, fill=(255, 255, 255))
    d.text((x + 2, y + 86), sub, font=f_sub, fill=(226, 232, 255))
    # 左上小标
    d.text((84, 60), "我的家乡 · 吉林四平", font=f_sub, fill=(255, 208, 120))
    return im


def main():
    tmp_dir = os.path.join(ROOT, "assets", "video", "_frames")
    os.makedirs(tmp_dir, exist_ok=True)
    writer = imageio_ffmpeg.write_frames(
        OUT, (W, H), fps=FPS, codec="libx264", quality=None,
        output_params=["-crf", "28", "-preset", "veryfast", "-pix_fmt", "yuv420p",
                       "-movflags", "+faststart"],
        macro_block_size=1,
    )
    writer.send(None)
    total = 0
    for name, title, sub in SLIDES:
        p = os.path.join(IMG, name)
        if not os.path.exists(p):
            continue
        base = cover(p)
        n = int(FPS * PER)
        for k in range(n):
            writer.send(frame(base, k, n, title, sub).tobytes())
        total += n
    writer.close()
    for f in os.listdir(tmp_dir):
        os.remove(os.path.join(tmp_dir, f))
    os.rmdir(tmp_dir)
    size_mb = os.path.getsize(OUT) / 1024 / 1024
    print("OUT=%s frames=%d duration=%.1fs size=%.2fMB" % (OUT, total, total / FPS, size_mb))


if __name__ == "__main__":
    main()
