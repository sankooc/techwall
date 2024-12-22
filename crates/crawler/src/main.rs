use std::{fs::{self}, io::Write};

use anyhow::{Ok, Result};
use crawler::convert;
use flate2::Compression;
use serde::Serialize;
use flate2::write::GzEncoder;
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
    scale: f32,
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
    let list = ["mongodb", "vite", "java", "javascript", "jetbrains",
    "redis", "rust", "go", "python","ubuntu", "puppeteer", "php", "tensorflow",
    "android", "auth0", "apple", "aws", "apache", "arduino","azure", "ant-design", "angular",
    "babel", "bash", "bytedance", 
    "c", "c-sharp","c-plusplus", "centos", "cypress", "css-3", "codepen", "coffeescript", "caffe2", "cordova", "cassandra", "cocoapods",
    "d3","django", "deno", "datadog", "dart", "dropbox", "docker", "dojo", "dotnet", "discord","drone",
    "express", "elm", "eclipse","etcd","erlang", "ember", "es6", "esbuild", "electron",
    "flickr", "fabric", "ffmpeg-icon",
    "gitlab", "github","git", "gcc", "grafana", "gopher","gwt", "gnome",
    "hadoop", "hbase", "html-5", "hexo", "heroku", "hugo", "hibernate",
    "ieee", "ionic", "ios",
    "jade", "jenkins", "jira",  "joomla","jekyll","julia", "jupyter",
    "kde", "khan_academy",
    "less","lua", "linux-tux","lodash","lucene",
    "macOS", "mocha", "markdown", "maven","mesos",
    "nginx", "nodejs", "npm", "nestjs", "nuxt",
    "ocaml","opencv", "openstack", "openshift", "oracle",
    "panda","pug", "phonegap", "postman", "pm2", "postgresql", "pytorch",
    "react", "redhat", "ruby",
    "snyk", "socket.io", "swift","sencha", "selenium",
    "typescript", "trello", "tomcat", "tiktok",
    "ubuntu", "vue", "vultr", "vim",  "v8", "webpack",
    "zhihu",
    "kafka","kubernetes", "kong", "koa", "kibana",
    "yarn", "yeoman"];
    // let list = ["javascript"];
    
    let mut meta_data = MetaData {
        items: Vec::new(),
    };
    for ll in list {
        
        let root = get_path("repo/geticon/icons");
        let path = format!("{}/{}.svg", root, ll);
        if fs::exists(path).unwrap() {

        } else {
            panic!("icon not found: {}", ll);
        }
    }
    for ll in list {
        println!("parse: {}", ll);
        // build_resouce(ll);
        let data = get_svg_bytes(ll).unwrap();
        let (pix, scale) = convert::convert_svg_to_png(data).unwrap();
        let w = pix.width() / 10;
        let h = pix.height() / 10;
        let content = pix.encode_png().unwrap();
        // std::fs::write(format!("{}/{}/icon.png", root, ll), &content).unwrap();
        let _content = techwall::png::load(&content, (w as usize,h as usize)).unwrap();
        let polygon = _content.iter().map(|f|Point::from(*f)).collect();
        let meta = Meta {
            width: pix.width(),
            height: pix.height(),
            scale,
            name: ll.to_string(),
            polygon,
        };
        meta_data.items.push(meta);
        std::fs::write(format!("{}/{}.png", target, ll), &content).unwrap();
    }
    
    let json_conten = serde_json::to_string(&meta_data).unwrap();
    // let file = File::create(format!("{}/meta", target)).unwrap();
    let data = json_conten.as_bytes();
    let mut encoder = GzEncoder::new(Vec::new(), Compression::default());
    encoder.write_all(data).unwrap();
    let content = encoder.finish().unwrap();
    std::fs::write(format!("{}/meta", target), content).unwrap();
}
