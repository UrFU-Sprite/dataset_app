import React from 'react';
import ReactDOM from 'react-dom/client';
import {BrowserRouter} from "react-router-dom";
import 'antd/dist/reset.css';

import App from 'components/App'
import internetFavicon from 'assets/internet-favicon.svg'

const setFavicon = () => {
    const link = document.querySelector("link[rel='icon']") || document.createElement('link')
    link.setAttribute('rel', 'icon')
    link.setAttribute('type', 'image/svg+xml')
    link.setAttribute('href', internetFavicon)
    document.head.appendChild(link)
}

const root = document.getElementById('root') as HTMLDivElement
setFavicon()
ReactDOM.createRoot(root).render(
    <BrowserRouter>
        <App/>
    </BrowserRouter>
);