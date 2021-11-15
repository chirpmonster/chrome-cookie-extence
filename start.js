const express=require('express');
const app=express()

app.use(express.static('build'))

console.log('127.0.0.1:1111')


app.listen(1111)