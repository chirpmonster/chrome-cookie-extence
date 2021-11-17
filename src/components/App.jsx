import React, { Component } from 'react';

import CookieCarrier from './CookieCarrier/index.jsx'

import './index.less'

export default class App extends Component{
    render() {
        return (
            <div className='chrome-box'>
                <CookieCarrier key={'CookieCarrier'}/>
                <div className='technical-support'>Powered by <a href='https://github.com/chirpmonster' target='_blank'>@chirpmonster</a></div>
            </div>
        )
    }
}