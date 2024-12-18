use js_sys::Uint8Array;
use wasm_bindgen::prelude::wasm_bindgen;
// use techwall::png::Point;

#[wasm_bindgen]
pub struct SVGResult {
    rect: (u32, u32),
    data: Vec<u8>,
    polygon: Vec<(u32, u32)>,
}

#[wasm_bindgen]
pub struct Point {
    x: u32,
    y: u32,
}
impl Point {
    pub fn new(x: u32, y: u32) -> Point {
        Point { x, y }
    }
}
#[wasm_bindgen]
impl Point {
    #[wasm_bindgen]
    pub fn x(&self) -> u32 {
        self.x
    }
    #[wasm_bindgen]
    pub fn y(&self) -> u32 {
        self.y
    }
}
impl From<(u32, u32)> for Point {
    fn from(value: (u32, u32)) -> Self {
        Point::new(value.0, value.1)
    }
}


impl SVGResult {
    fn new(data: Vec<u8>, rect: (u32, u32), polygon: Vec<(u32, u32)>) -> SVGResult {
        SVGResult { data, rect, polygon }
    }
}

#[wasm_bindgen]
impl SVGResult {
    #[wasm_bindgen]
    pub fn data(&self) -> Uint8Array {
        let slice = self.data.as_slice();
        slice.into()
    }
    #[wasm_bindgen]
    pub fn rect(&self) -> Point {
        Point::from(self.rect)
    }
    

    #[wasm_bindgen]
    pub fn polygon(&self) -> Vec<Point> {
        self.polygon.iter().map(|f|Point::from(*f)).collect()
    }

}

#[wasm_bindgen]
pub fn load_svg (s: &Uint8Array) -> SVGResult {
    let data = s.to_vec();
    let pix = crawler::convert::convert_svg_to_png(data).unwrap();
    
    let w = pix.width() / 10;
    let h = pix.height() / 10;
    let content = pix.encode_png().unwrap();
    let polygon = techwall::png::load(&content, (w as usize,h as usize)).unwrap();

    SVGResult::new(content, (w, h), polygon)
}