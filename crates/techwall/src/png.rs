use image::{DynamicImage, GenericImageView, RgbaImage};
use anyhow::{bail, Result};

// const OUTPUT_WIDTH: u32 = 1200;
// const OUTPUT_HEIGHT: u32 = 600;
// const TARGET_VERTICES: usize = 8; // Fixed number of vertices for polygon

// Function to trim transparent borders from an image
fn _trim_image(image: &DynamicImage) -> DynamicImage {
    let (width, height) = image.dimensions();
    let mut left = width;
    let mut right = 0;
    let mut top = height;
    let mut bottom = 0;

    for y in 0..height {
        for x in 0..width {
            let pixel = image.get_pixel(x, y);
            if pixel[3] > 0 { // Check alpha channel
                if x < left {
                    left = x;
                }
                if x > right {
                    right = x;
                }
                if y < top {
                    top = y;
                }
                if y > bottom {
                    bottom = y;
                }
            }
        }
    }

    image.crop_imm(left, top, right - left + 1, bottom - top + 1)
}




/// 主函数：从图像生成多边形顶点
pub fn generate_polygon(image: &RgbaImage, steps: (usize, usize)) -> Vec<Point> {
    // Step 1: 提取边缘点
    let points = extract_edge_points(image, steps);
    // println!("{:?}", points);
    points
    // Step 2: 使用 Andrew 算法构造凸包
    // let polygon = andrew_algorithm(&points);
    
    // polygon
}

// const STEP: usize = 5;
// const PADDING: u32 = 1;


fn not_empty(image: &RgbaImage, p: Point) -> bool{
    let (x, y) = p;
    image.get_pixel(x, y)[3] > 0
}

fn curv <T, S>(image: &RgbaImage, y_axis: T, x_axis: S, steps: (usize, usize)) -> (Vec<Point>, Point) 
where 
    T: Iterator<Item = u32> + Clone, 
    S: Iterator<Item = u32> + Clone,
    {
    let mut points = Vec::new();
    let mut x_tmp = x_axis.clone();
    let y_tmp = y_axis.clone();
    let x_head = x_tmp.next().unwrap();
    let x_tail = x_tmp.last().unwrap();

    let mut last_x_index = x_tail;
    let y_tail = y_tmp.last().unwrap();

    
    let mut last = (x_head, y_tail);


    for _y in y_axis.clone().step_by(steps.1) {
        'line: for _x in x_axis.clone(){
            if (x_tail..last_x_index).contains(&_x) ||  (last_x_index..x_tail).contains(&_x)  {
                break 'line;
            }
            if not_empty(&image, (_x, _y)) {
                if _x == x_head {
                    return (points, (_x, _y));
                }
                points.push((_x, _y));
                last_x_index = _x;
                last = (_x, _y);
                break 'line;
            }
        }
    }
    (points, last)
}
fn extract_edge_points(image: &RgbaImage, steps: (usize, usize)) -> Vec<Point> {
    let mut points = Vec::new();
    let (width, height) = image.dimensions();
    
    let (mut ll, right_top) = curv(&image, 0..height, (0..width).rev(), steps.clone());
    
    points.append(&mut ll); 
    points.push(right_top);
    if right_top.1 < height - 1 {
        let (mut rl2, bottom) = curv(&image, (right_top.1..height).rev(), (0..width).rev(), steps.clone());
        
        rl2.reverse();
        points.push(bottom);
        points.append(&mut rl2);

    }
    let (mut rl, left) = curv(&image, (0..height).rev(), 0..width, steps.clone());
    points.append(&mut rl); 
    points.push(left);

    if left.1 > 0 {
        let (mut ll, top) = curv(&image, 0..left.1, 0..width, steps.clone());
        ll.reverse();
        points.push(top);
        points.append(&mut ll); 
    }
    points
}

fn _andrew_algorithm(points: &[Point]) -> Vec<Point> {
    // 按 x 坐标排序，如果 x 相等按 y 排序
    let mut sorted_points = points.to_vec();
    
    sorted_points.sort_by(|&(x1, y1), &(x2, y2)| {
        if x1 == x2 {
            y1.cmp(&y2)
        } else {
            x1.cmp(&x2)
        }
    });

    // 构造下凸包
    let mut lower = Vec::new();
    for &p in &sorted_points {
        if lower.len() >= 2 && !_is_ccw(lower[lower.len() - 2], lower[lower.len() - 1], p, true) {
            lower.pop();
        }
        lower.push(p);
    }
    // 构造上凸包
    let mut upper = Vec::new();
    for &p in sorted_points.iter().rev() {
        if upper.len() >= 2 && _is_ccw(upper[upper.len() - 2], upper[upper.len() - 1], p, false) {
            upper.pop();
        }
        upper.push(p);
    }

    // 去掉上下凸包的重复点
    lower.pop();
    upper.pop();
    lower.extend(upper);

    lower
}

/// 判断三点是否构成逆时针方向
fn _is_ccw(p1: Point, p2: Point, p3: Point, rev: bool) -> bool {
    let (x1, y1) = p1;
    let (x2, y2) = p2;
    let (x3, y3) = p3;
    let x_1 = || if rev {x2 - x1} else {x1 -x2};
    let x_2 = || if rev {x3 - x1} else {x1 -x3};
    if y2 <= y1 {
        if y3 >= y2 {
            return true;
        }
        return x_1() * (y1 - y3) > (y1 - y2) * x_2()
        //
    } else {
        if y3 <= y2 {
            return false;
        }
        return x_1() * (y3 -y1) > (y2 - y1) * x_2()
    }
    
    // if y3 >= y2 && y2 <= y1 {
    //     return false
    // }
    // (x2 - x1) as i64 * (y3 - y1) as i64 - (y2 - y1) as i64 * (x3 - x1) as i64 > 0
}
// fn generate_polygon(image: &RgbaImage, size: usize) -> Vec<(u32, u32)> {
//     let mut points = Vec::new();

//     // 提取图片中的非透明像素点
//     for y in 0..image.height() {
//         for x in 0..image.width() {
//             let pixel = image.get_pixel(x, y);
//             if pixel[3] > 0 { // alpha 通道大于 0 表示非透明像素
//                 points.push(Point { x, y });
//             }
//         }
//     }

//     // 使用凸包算法计算最小凸多边形
//     let mut convex_hull = graham_scan(&mut points);

//     // 如果凸包顶点数超过所需的顶点数，截取前size个
//     // if convex_hull.len() > size {
//     //     convex_hull.truncate(size);
//     // }

//     // 返回最终的顶点
//     convex_hull.iter().map(|p| (p.x, p.y)).collect()
// }

// Function to mask and crop image based on a polygon
fn _crop_to_polygon(image: &RgbaImage, polygon: &[(u32, u32)]) -> RgbaImage {
    let (width, height) = image.dimensions();
    let mut output = RgbaImage::new(width, height);

    for p in polygon {
        let (x, y) = *p;
        // let px = image.get_pixel(x, y).clone();
        let px = image::Rgba([255, 255, 255, 255]);
        output.put_pixel(x, y, px);
    }

    output
}

// Check if a point is inside a polygon
fn _point_in_polygon(x: u32, y: u32, polygon: &[(u32, u32)]) -> bool {
    let mut inside = false;
    let mut j = polygon.len() - 1;
    for i in 0..polygon.len() {
        let (xi, yi) = polygon[i];
        let (xj, yj) = polygon[j];
        if ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
            inside = !inside;
        }
        j = i;
    }
    inside
}


type Point = (u32, u32);

pub fn load(data: &[u8], steps: (usize, usize)) -> Result<Vec<(u32, u32)>>{
    let img = image::load_from_memory(data)?;
    match img {
        DynamicImage::ImageRgba8(trimmed) => {
            // println!("Trimmed image dimensions: {:?}", trimmed.dimensions());
            let polygon = generate_polygon(&trimmed, steps);
            return Ok(polygon);
            // println!("-- {:?}", polygon);
            // let _image = crop_to_polygon(&trimmed, &polygon);

            // let mut buffer = Cursor::new(Vec::new());
            // _image.write_to(&mut buffer, image::ImageFormat::Png)?;
            // return Ok(buffer.into_inner());
        }
        _ => {}
    }
    bail!("")
}