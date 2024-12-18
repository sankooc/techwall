use anyhow::{Ok, Result};
use crawler::convert;
use std::fs::{self};
fn get_svg_bytes(name: &str) -> Result<Vec<u8>> {
    let root = "/home/sankooc/repo/techwall/icons";
    let path = format!("{}/{}/icon.svg", root, name);
    let content = std::fs::read(path)?;
    Ok(content)
}

// fn convert_svg_to_png(data: Vec<u8>) -> Result<Pixmap> {
//     // pixmap.scale(width as f32 / target_width as f32, height as f32 / target_height as f32);
//     // if fs::exists(png_path)? {
//     //     fs::remove_file(png_path)?;
//     // }
//     // // 将结果保存为 PNG
//     // pixmap.save_png(png_path)?;

//     // println!(
//     //     "SVG converted to PNG: {} ({}x{})", png_path, target_width, target_height
//     // );
//     Ok(pixmap)
// }

fn build_resouce(name: &str){
    let icon_root = "/home/sankooc/repo/geticon/icons";
    let root = "/home/sankooc/repo/techwall/icons";
    if fs::exists(format!("{}/{}/icon.svg", root, name)).unwrap() {
        fs::remove_file(format!("{}/{}/icon.svg", root, name)).unwrap();
    }
    if !fs::exists(format!("{}/{}", root, name)).unwrap() {
        fs::create_dir(format!("{}/{}", root, name)).unwrap();
    }
    fs::copy(format!("{}/{}.svg", icon_root, name), format!("{}/{}/icon.svg", root, name)).unwrap();
}
fn main() {
    let root = "/home/sankooc/repo/techwall/icons";
    let list = ["mongodb", "vite", "java", "mega", "javascript"];
    for ll in list {
        build_resouce(ll);
        let data = get_svg_bytes(ll).unwrap();
        let pix = convert::convert_svg_to_png(data).unwrap();
        let w = pix.width() / 10;
        let h = pix.height() / 10;
        let content = pix.encode_png().unwrap();
        std::fs::write(format!("{}/{}/icon.png", root, ll), &content).unwrap();
        let _content = techwall::png::load(&content, (w as usize,h as usize)).unwrap();
        // std::fs::write(format!("{}/{}/icon_shadow.png", root, ll), &_content).unwrap();
    }
    // let data = get_svg_bytes("mongodb").unwrap();
    // let pix = convert_svg_to_png(data, "/home/sankooc/repo/techwall/out/mongodb.png").unwrap();
    // println!("{} - {}", pix.width(), pix.height());
}
