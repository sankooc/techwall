pub type Point = (u32, u32);

type Polygon = Vec<Point>;

struct Icon {
    width: u32,      // 图片宽度
    height: u32,     // 图片高度
    polygon: Polygon, // 以图片左上角为原点的多边形顶点
    scale: f32,      // 图片缩放比例
}

struct Position {
    x: u32,
    y: u32,
    icon: Icon,
}

// 判断两多边形是否重叠
fn polygons_overlap(p1: &Polygon, p2: &Polygon, offset1: (u32, u32), offset2: (u32, u32)) -> bool {
    let translate = |p: &Polygon, offset: (u32, u32)| -> Polygon {
        p.iter().map(|&(x, y)| (x + offset.0, y + offset.1)).collect()
    };

    let poly1 = translate(p1, offset1);
    let poly2 = translate(p2, offset2);

    let axes = get_axes(&poly1).into_iter().chain(get_axes(&poly2));

    for axis in axes {
        let (min1, max1) = project_polygon(&poly1, &axis);
        let (min2, max2) = project_polygon(&poly2, &axis);
        if max1 <= min2 || max2 <= min1 {
            return false;
        }
    }
    true
}

// 获取多边形的分离轴
fn get_axes(polygon: &Polygon) -> Vec<(i32, i32)> {
    let mut axes = Vec::new();
    for i in 0..polygon.len() {
        let p1 = polygon[i];
        let p2 = polygon[(i + 1) % polygon.len()];
        let edge = (p2.0 as i32 - p1.0 as i32, p2.1 as i32 - p1.1 as i32);
        axes.push((-edge.1, edge.0)); // 垂直边
    }
    axes
}

// 将多边形投影到轴上
fn project_polygon(polygon: &Polygon, axis: &(i32, i32)) -> (i32, i32) {
    let dot = |p: &(u32, u32), axis: &(i32, i32)| -> i32 {
        (p.0 as i32) * axis.0 + (p.1 as i32) * axis.1
    };
    let mut min = dot(&polygon[0], axis);
    let mut max = min;
    for point in polygon.iter().skip(1) {
        let projection = dot(point, axis);
        min = min.min(projection);
        max = max.max(projection);
    }
    (min, max)
}

fn re_align(items: &mut Vec<Position>) {
    let mut placed_items: Vec<Position> = Vec::new();

    for item in items.iter_mut() {
        let scaled_polygon: Polygon = item
            .icon
            .polygon
            .iter()
            .map(|&(x, y)| {
                (
                    (x as f32 * item.icon.scale) as u32,
                    (y as f32 * item.icon.scale) as u32,
                )
            })
            .collect();

        let mut placed = false;
        for y in 0..10000 { // 假设画布无限大
            for x in 0..10000 {
                let is_overlap = placed_items.iter().any(|placed_item| {
                    polygons_overlap(
                        &scaled_polygon,
                        &placed_item.icon.polygon,
                        (x, y),
                        (placed_item.x, placed_item.y),
                    )
                });

                if !is_overlap {
                    item.x = x;
                    item.y = y;
                    placed_items.push(Position {
                        x,
                        y,
                        icon: Icon {
                            width: item.icon.width,
                            height: item.icon.height,
                            polygon: scaled_polygon.clone(),
                            scale: item.icon.scale,
                        },
                    });
                    placed = true;
                    break;
                }
            }
            if placed {
                break;
            }
        }
    }
}

fn main() {
    let icon1 = Icon {
        width: 100,
        height: 200,
        polygon: vec![(0, 0), (100, 0), (100, 200), (0, 200)],
        scale: 1.0,
    };

    let icon2 = Icon {
        width: 150,
        height: 150,
        polygon: vec![(0, 0), (150, 0), (150, 150), (0, 150)],
        scale: 1.0,
    };

    let mut items = vec![
        Position { x: 0, y: 0, icon: icon1 },
        Position { x: 0, y: 0, icon: icon2 },
    ];

    re_align(&mut items);

    for (i, item) in items.iter().enumerate() {
        println!(
            "Item {}: Position = ({}, {}), Polygon = {:?}",
            i, item.x, item.y, item.icon.polygon
        );
    }
}
