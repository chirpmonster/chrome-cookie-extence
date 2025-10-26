import React, {Component} from 'react';
import {Switch} from 'antd'

import './index.less'

export default class AutoApprovalForm extends Component {

    state = {
        autoCompleteStatus: null,
        getStatus: false
    }

    componentDidMount() {
        this.setAutoCompleteStatus()
    }

    setAutoCompleteStatus = (autoCompleteStatus = null) => {
        chrome.runtime.sendMessage(
            {
                type: 'autoCompleteStatus',
                autoCompleteStatus
            },
            (res) => {
                if (res.success) {
                    this.setState({autoCompleteStatus: res.autoCompleteStatus, getStatus: true})
                }
            }
        );
    }

    render() {
        let {autoCompleteStatus, getStatus} = this.state;
        return [
            <div>
                {
                    getStatus ?
                        <div className='AutoApprovalForm'>
                            自动填写审批单：
                            <Switch defaultChecked
                                    checked={this.state.autoCompleteStatus}
                                    onChange={() => {
                                        this.setAutoCompleteStatus(!autoCompleteStatus)
                                    }}/>
                        </div> : 'loading'
                }
            </div>
        ]

    }
}