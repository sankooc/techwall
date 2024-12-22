import { Vector } from "matter-js";


let META_TYPE = "PNG";

export class Meta {
    name?: string;
    width?: number;
    height?: number;
    polygon?: Vector[];
    scale: number;
    rotation: boolean = true;
    _data?: string;
    static url(item: Meta): string {
        switch (META_TYPE) {
            case "SVG":
                return '/techwall/icons/' + item.name + '.svg';
        }
        return '/techwall/resource/' + item.name + '.png';
    }
    static dataURL(item: Meta): string {
        switch (META_TYPE) {
            case "SVG":
                return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(item._data)}`;
        }
        return '/techwall/resource/' + item.name + '.png';
    }
    static load(meta: Meta): Promise<Meta>{
        switch (META_TYPE) {
            case "SVG":
                return Meta.loadSVG(meta);
        }
        return Meta.loadPNG(meta);
    }
    static loadPNG(meta: Meta): Promise<Meta> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = Meta.url(meta);
            const timer = setTimeout(() => {
                reject(new Error('Image load timed out'));
            }, 5000);
    
            img.onload = () => {
                clearTimeout(timer);
                resolve(meta);
            };
    
            img.onerror = () => {
                clearTimeout(timer);
                reject(new Error('Image load failed'));
            };
        });
    }
    static loadSVG(meta: Meta): Promise<Meta> {
        return new Promise((resolve, reject) => {
            fetch(Meta.url(meta)).then((resp) => {
                return resp.blob().then((blob) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        meta._data = reader.result as string;
                        resolve(meta);
                    };
                    reader.readAsText(blob);
                });
            }).catch(reject);
        });
    }
}

export class Frame {
    name: string;
    background: string;
    left: number;
    right: number;
    constructor(name: string, background: string, left: number, right: number) {
        this.name = name;
        this.background = background;
        this.left = left;
        this.right = right;
    }
    isColor(): boolean {
        return /^#([A-Fa-f0-9]{6})$/.test(this.background);
    }
}