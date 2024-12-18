use anyhow::{Ok, Result};
use crawler::convert;
use serde::Serialize;

#[warn(dead_code)]
fn get_path(name: &str) -> String {
    let home = std::env::home_dir().unwrap().display().to_string();
    format!("{}/{}", home, name)
}
fn get_svg_bytes(name: &str) -> Result<Vec<u8>> {
    let root = get_path("repo/geticon/icons");
    let path = format!("{}/{}.svg", root, name);
    let content = std::fs::read(path)?;
    Ok(content)
}

#[derive(Serialize)]
pub struct Point {
    x: u32,
    y: u32,
}

impl From<(u32, u32)> for Point {
    fn from((x, y): (u32, u32)) -> Self {
        Point { x, y }
    }
}
#[derive(Serialize)]
pub struct Meta {
    name: String,
    width: u32,
    height: u32,
    polygon: Vec<Point>,
}

#[derive(Serialize)]
pub struct MetaData {
    items: Vec<Meta>,
}

// fn build_resouce(name: &str){
//     let icon_root = get_path("repo/geticon/icons");
//     let root = get_path("repo/techwall/icons");
//     if fs::exists(format!("{}/{}/icon.svg", root, name)).unwrap() {
//         fs::remove_file(format!("{}/{}/icon.svg", root, name)).unwrap();
//     }
//     if !fs::exists(format!("{}/{}", root, name)).unwrap() {
//         fs::create_dir(format!("{}/{}", root, name)).unwrap();
//     }
//     fs::copy(format!("{}/{}.svg", icon_root, name), format!("{}/{}/icon.svg", root, name)).unwrap();
// }
fn main() {
    // let root = get_path("repo/techwall/icons");
    let target = get_path("repo/techwall/front/public/resource");
    let list = ["mongodb", "vite", "java", "mega", "javascript", 
    "android", "auth0", "apple", "aws", 
    "babel", "bash", 
    "c", "c-sharp","c-plusplus", "centos", "cypress", "css-3", "codepen",
    "d3","django", "deno", "datadog", "dart", "dropbox", "docker", "dojo", "dotnet", "discord","dyndns",
    "express", "elm", "eclipse","etcd","erlang", "ember", "es6", "esbuild", 
    "flickr", "fabric",
    "panda","pug",
    "zenhub",
    "kafka","kubernetes", "kong", "koa", "kibana",
    "rust", "go", "python", "puppeteer", "php", "tensorflow"];
    // let list = ["javascript"];
    
    let mut meta_data = MetaData {
        items: Vec::new(),
    };
    for ll in list {
        println!("parse: {}", ll);
        // build_resouce(ll);
        let data = get_svg_bytes(ll).unwrap();
        let pix = convert::convert_svg_to_png(data).unwrap();
        let w = pix.width() / 10;
        let h = pix.height() / 10;
        let content = pix.encode_png().unwrap();
        // std::fs::write(format!("{}/{}/icon.png", root, ll), &content).unwrap();
        let _content = techwall::png::load(&content, (w as usize,h as usize)).unwrap();
        let polygon = _content.iter().map(|f|Point::from(*f)).collect();
        let meta = Meta {
            width: pix.width(),
            height: pix.height(),
            name: ll.to_string(),
            polygon,
        };
        meta_data.items.push(meta);
        std::fs::write(format!("{}/{}.png", target, ll), &content).unwrap();
        // let base64_data = general_purpose::STANDARD.encode(&content);
        // println!("base: {}", base64_data);



        // std::fs::write(format!("{}/{}/icon_shadow.png", root, ll), &_content).unwrap();
    }
    
    let json_conten = serde_json::to_string(&meta_data).unwrap();
    std::fs::write(format!("{}/meta.json", target), json_conten).unwrap();
}
