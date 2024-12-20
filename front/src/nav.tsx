import { useEffect, useRef, useState } from 'react';
import Box from './box.tsx';
import Layout from './layout.tsx';
import { Frame } from './common.ts';
import { decompressSync } from 'fflate';
const App = () => {
    const [Page, setPage] = useState(<div>Loading</div>);
    

    const frames = [
        new Frame('def', "#f0f0f0", 0, 0),
        new Frame('text', "/techwall/resource/bg/textile-bg.jpg", 0, 0)
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
    
    return (
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
            {Page}
        </div>
    );
};

export default App;
