import React, {Component} from 'react';
import {Switch} from 'antd'

import './index.less'

export default class CookieCarrier extends Component {

    state = {
        cookieStatus: null,
        getStatus: false
    }

    componentDidMount() {
        this.getCookieStatus()
    }

    getCookieStatus = (cookieStatus = null) => {
        chrome.runtime.sendMessage(
            {
                type: 'cookieStatus',
                cookieStatus
            },
            (res) => {
                if (res.success) {
                    this.setState({cookieStatus: res.cookieStatus, getStatus: true})
                }
            }
        );
    }

    render() {
        let {cookieStatus, getStatus} = this.state;
        return [
            <div>
                {
                    getStatus ?
                        <div className='CookieCarrier'>
                            强制携带cookie：
                            <Switch defaultChecked
                                    checked={this.state.cookieStatus}
                                    onChange={() => {
                                        this.getCookieStatus(!cookieStatus)
                                    }}/>
                            <span className='CookieCarrier-ex-text'>建议仅开发时打开</span>
                        </div> : 'loading'
                }
            </div>
        ]

    }
}