#[cfg(test)]
mod comm {
    #[test]
    fn test_1() {
        println!("------");
        let root = "/home/sankooc/repo/techwall/icons/mega/icon.png";
        // let fname = format!("{}/icon_trim.png", root);
        // let fname = format!("{}/svg/aws.png", root);
        let content = std::fs::read(root).unwrap();
        let _content = techwall::png::load(&content, (4,4)).unwrap();
        println!("{:?}", _content)
        // std::fs::write(format!("{}/test2.png", root), &_content).unwrap();
    }
}