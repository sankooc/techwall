import { useEffect, useRef, useState } from 'react';
import Layout from './Layout.tsx';
import { Frame } from './common.ts';
import { decompressSync } from 'fflate';
const App = () => {
    const [Page, setPage] = useState(<div>Loading</div>);
    

    const frames = [
        new Frame('def', "#f0f0f0", 0, 0),
        new Frame('text', "/techwall/background/textile-bg.jpg", 0, 0),
        new Frame('text', "https://i.ibb.co/tCr8qFs/paper.jpg", 0, 0),
        new Frame('text', "https://i.postimg.cc/gjZkNGWm/pexels-shonejai-445753-1227511.jpg", 0, 0),
    ];
    useEffect(() => {
        fetch("/techwall/resource/meta").then((response) => {
            response.blob().then((blob) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const arrayBuffer: ArrayBuffer = reader.result as ArrayBuffer;
                    const array = new Uint8Array(arrayBuffer);
                    const decompressedData = decompressSync(array);
                    const rawData = new TextDecoder().decode(decompressedData);
                    const data = JSON.parse(rawData);
                    setPage(<Layout metaList={data.items || []} frames={frames}/> );
                };
                reader.readAsArrayBuffer(blob);
            });
        })
    }, []);
    
    return Page;
};

export default App;
