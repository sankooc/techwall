import { Vector } from "matter-js";

export class Meta {
    name?: string;
    width?: number;
    height?: number;
    polygon?: Vector[];
    scale: number = 1;
    rotation: boolean = true;
    static url(item: Meta): string {
        return '/resource/' + item.name + '.png';
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