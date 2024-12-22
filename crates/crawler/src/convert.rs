use std::sync::Arc;

use resvg::tiny_skia::Pixmap;
use anyhow::Result;
use usvg::{fontdb, Size, Transform};

fn get_scale(size: Size) -> (f32, f32) {
    let stsize = 10000f32;
    let total = size.width() * size.height();
    if total < stsize {
        return (1f32, 1f32)
    }
    let rate = stsize / total;
    let ff = rate.sqrt();
    (ff,ff)
}

pub fn convert_svg_to_png(data: Vec<u8>) -> Result<(Pixmap, f32)> {
    let svg_data = String::from_utf8(data)?;
    let mut opt = usvg::Options::default();
    let mut fdb = fontdb::Database::new();
    fdb.load_system_fonts();
    opt.fontdb = Arc::new(fdb);
    let tree = usvg::Tree::from_str(&svg_data, &opt)?;
    
    let svg_size = tree.size();
    let original_width = svg_size.width();
    let original_height = svg_size.height();

    // println!("original_width: {}, original_height: {}", original_width, original_height);
    let scale = get_scale(svg_size);
    // let scale = (1f32, 1f32);

    let target_width = (original_width * scale.0) as u32;
    let target_height = (original_height * scale.1) as u32;
    // println!("target_width: {}, target_height: {}", target_width, target_height);
    let mut pixmap = Pixmap::new(target_width, target_height).ok_or("incorrect size").unwrap();
    
    let transform = Transform::from_scale(scale.0, scale.1);
    // transform.
    // transform.scale(get_scale(svg_size));
    resvg::render(
        &tree,
        transform,
        &mut pixmap.as_mut(),
    );
    Ok((pixmap, scale.0))
}
