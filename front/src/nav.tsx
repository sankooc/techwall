import React, { useEffect, useRef, useState } from 'react';
import Box from './box';

const App = () => {
    const [Page, setPage] = useState(<div>Loading</div>);
    
    useEffect(() => {
        fetch("/resource/meta.json").then((response) => {
            response.json().then((data) => {
                setPage(<Box meta={data} />);
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
