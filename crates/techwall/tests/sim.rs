#[cfg(test)]
mod comm {
    #[test]
    fn test_1() {
        let home = std::env::home_dir().unwrap().display().to_string();
        println!("{:?}", home);
        let root = format!("{}/repo/techwall/icons/mega/icon.png", home);
        let content = std::fs::read(root).unwrap();
        let _content = techwall::png::load(&content, (4,4)).unwrap();
        println!("{:?}", _content)
    }
}