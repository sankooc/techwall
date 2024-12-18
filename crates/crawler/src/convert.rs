use std::sync::Arc;

use resvg::tiny_skia::Pixmap;
use anyhow::Result;
use usvg::{fontdb, Transform};

pub fn convert_svg_to_png(data: Vec<u8>) -> Result<Pixmap> {
    // 读取 SVG 文件内容
    let svg_data = String::from_utf8(data)?;
    // 解析 SVG 文件
    let mut opt = usvg::Options::default();
    let mut fdb = fontdb::Database::new();
    fdb.load_system_fonts();
    opt.fontdb = Arc::new(fdb);
    let tree = usvg::Tree::from_str(&svg_data, &opt)?;
    
    // 获取原始 SVG 尺寸
    let svg_size = tree.size();
    let original_width = svg_size.width();
    let original_height = svg_size.height();

    let target_width = original_width as u32;
    let target_height = original_height as u32;
    let mut pixmap = Pixmap::new(target_width, target_height).ok_or("inco").unwrap();
    
    let transform = Transform::identity();
    resvg::render(
        &tree,
        transform,
        &mut pixmap.as_mut(),
    );
    Ok(pixmap)
}
