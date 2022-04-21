const http = require('http')
const FormData = require('form-data')
const fs = require('fs')

async function request(url, method, headers = null, data = null, multipart = false) {
    const {hostname, pathname, search, port} = new URL(url)
    const options = {
        hostname,
        path: pathname + search,
        port,
        method,
        headers
    }
    return await new Promise((resolve, reject) => {
        function callback(res) {
            let buffer = ''
            res
                .on('data', (chunk) => buffer += chunk)
                .on('error', (error) => reject(error))
                .on('end', () => {
                    if (res.headers['content-type'].startsWith('application/json')) buffer = JSON.parse(buffer)
                    resolve({status: res.statusCode, body: buffer})
                })
        }
        const req = http.request(options, res => callback(res))
        req.on('error', error => reject(error))
        if (!multipart && data && method === 'POST') req.write(data)
        multipart ? data.pipe(req) : req.end()
    })
}

async function postApiCaptchaCheckError(res) {
    if (res.status !== 200) throw new Error(`Status ${res.status}`)
    const {status, request} = res.body
    const critical = [
        'ERROR_WRONG_USER_KEY',
        'ERROR_KEY_DOES_NOT_EXIST',
        'ERROR_ZERO_BALANCE'
    ]
    if (!status && critical.includes(request)) throw new Error(request)
}

async function sendGridCaptcha(hint, apikey) {
    const data = new FormData()
    data.append('key', apikey)
    data.append('method', 'post')
    data.append('recaptcha', '1')
    data.append('file', fs.createReadStream(__dirname + '/screenshot.png'))
    data.append('textinstructions', hint)
    data.append('recaptcharows', 2)
    data.append('recaptchacols', 3)
    data.append('lang', 'en')
    data.append('json', '1')

    const url = 'http://2captcha.com/in.php'
    const headers = {
        ...data.getHeaders()
    }
    console.log('   >> POST Captcha')
    return await request(url, 'POST', headers, data, true)
}

async function getCaptcha(id, apikey) {
    const params = new URLSearchParams({
        key: apikey,
        action: 'get',
        id,
        json: '1',
    }).toString()
    const url = `http://2captcha.com/res.php?${params}`
    console.log('   >> GET Solution')
    return await request(url, 'GET')
}

async function reportAnswer(isValid, id, apikey) {
    const params = new URLSearchParams({
        key: apikey,
        action: isValid ? 'reportgood' : 'reportbad',
        id,
        json: '1',
    }).toString()
    const url = `http://2captcha.com/res.php?${params}`
    console.log('   >> GET Solution')
    return await request(url, 'GET')
}

async function solveGridCaptcha(hint, apikey) {
    try {
        const res = await sendGridCaptcha(hint, apikey)
        console.log(res)
        await postApiCaptchaCheckError(res)
        console.log('   << ID', res.body.request)
        for (let i = 0; i < 50; i++) {
            await new Promise(resolve => setTimeout(resolve, 5000))
            const check = await getCaptcha(res.body.request, apikey)
            console.log(check)
            await postApiCaptchaCheckError(check)
            if (check.body.status) {
                if (!check.body.request ||
                    !check.body.request.startsWith('click:') ||
                    check.body.request.split(':')[1].includes('/')) {
                    console.log('REPORT BAD')
                    await reportAnswer(false, res.body.request, apikey)
                    return {x: 0, y: 0}
                } else {
                    console.log('REPORT GOOD')
                    await reportAnswer(true, res.body.request, apikey)
                    const tile = parseInt(check.body.request.split(':')[1])
                    const x = 50 + ((tile - 1) % 3) * 100
                    const y = 50 + Math.floor((tile - 1) / 3) * 100
                    return {x, y}
                }
            }
            console.log('   <<', check.body.request)
        }
    } catch (error) {
        console.error(error)
    }
}

module.exports = {
    solveGridCaptcha
}
