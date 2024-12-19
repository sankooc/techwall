import { useEffect, useRef, useState } from 'react';
import Box from './box.tsx';
import Layout from './layout.tsx';
import { Frame } from './common.ts';

const App = () => {
    const [Page, setPage] = useState(<div>Loading</div>);
    

    const frames = [
        new Frame('def', "#f0f0f0", 0, 0),
        new Frame('text', "/resource/bg/textile-bg.jpg", 0, 0)
    ];
    useEffect(() => {
        fetch("/resource/meta.json").then((response) => {
            response.json().then((data) => {
                setPage(<Layout metaList={data.items || []} frames={frames}/> );
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
