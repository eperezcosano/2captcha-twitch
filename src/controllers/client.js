const { firefox } = require('playwright')
const passGenerator = require('generate-password')
const generateUsername = require('better-usernames')
const api = require('./api')

async function handleCaptcha(page, apikey, debug = false) {
    if (debug) console.log('Captcha Detected')
    let captcha = 1
    await new Promise(resolve => setTimeout(resolve, 1000))
    await page.frameLocator('iframe[title="Captcha Challenge"]').frameLocator('iframe[title="Verification challenge"]').frameLocator('#fc-iframe-wrap').frameLocator('#CaptchaFrame').locator('#home_children_button').click({delay: 100})
    await new Promise(resolve => setTimeout(resolve, 1000))
    let retry, i = 0
    while (captcha && !retry && i < 10) {
        const hint = await page.frameLocator('iframe[title="Captcha Challenge"]').frameLocator('iframe[title="Verification challenge"]').frameLocator('#fc-iframe-wrap').frameLocator('#CaptchaFrame').locator('#game_children_text > h2').textContent()
        await page.frameLocator('iframe[title="Captcha Challenge"]').frameLocator('iframe[title="Verification challenge"]').frameLocator('#fc-iframe-wrap').frameLocator('#CaptchaFrame').locator('#game_children_challenge').screenshot({path: __dirname + '/screenshot.png'})
        if (debug) console.log('>> ', hint)

        const {x, y} = await api.solveGridCaptcha(hint, apikey, debug)
        if (debug) console.log('<< Click', x, y)
        await page.frameLocator('iframe[title="Captcha Challenge"]').frameLocator('iframe[title="Verification challenge"]').frameLocator('#fc-iframe-wrap').frameLocator('#CaptchaFrame').locator('#game_children_challenge').click({position: {x, y}, delay: 100})

        await new Promise(resolve => setTimeout(resolve, 5000))
        captcha = await page.locator('iframe[title="Captcha Challenge"]').count()
        if (captcha) retry = await page.frameLocator('iframe[title="Captcha Challenge"]').frameLocator('iframe[title="Verification challenge"]').frameLocator('#fc-iframe-wrap').frameLocator('#CaptchaFrame').locator('#wrong_children_button').count()
        i++
    }
    if (retry) throw new Error('Not solved (retry)')
    if (captcha) throw new Error('Not solved (attempts exceed)')
    if (debug) console.log('Captcha Solved Successfully')
}

async function signup(apikey, debug = false) {
    if (!apikey) {
        console.error('No API key provided')
        return
    }
    const browser = await firefox.launch({ headless: true })
    try {
        const context = await browser.newContext({ locale: 'en-GB' })
        const emailPage = await context.newPage()
        await emailPage.goto('https://embedded.cryptogmail.com/')
        let email
        if (debug) console.log('Generating a new e-mail...')
        while (true) {
            await new Promise(resolve => setTimeout(resolve, 1000))
            email = await emailPage.locator('.js-email').textContent()
            if (!email.endsWith('@vintomaper.com')) break
            await emailPage.locator('a.button--remove').click()
        }
        if (debug) console.log('E-mail:', email)
        const page = await context.newPage()
        await page.goto(`https://www.twitch.tv/signup`)
        let username
        do {
            username = generateUsername({separator: '_'})
        } while (username.length < 4 || username.length > 25 || username.includes('-'))
        if (debug) console.log('Username:', username)
        await page.locator('input#signup-username').click()
        await page.keyboard.type(username, {delay: 100})
        await page.keyboard.press('Tab', {delay: 100})
        const password = passGenerator.generate({
            length: 20,
            strict: true
        });
        if (debug) console.log('Password:', password)
        await page.keyboard.type(password,{delay: 100})
        await page.keyboard.press('Tab', {delay: 100})
        await page.keyboard.type(password,{delay: 100})
        await page.keyboard.press('Tab', {delay: 100})
        const day = Math.floor(Math.random() * 28) + 1
        await page.keyboard.type(day.toString(),{delay: 100})
        await page.keyboard.press('Tab', {delay: 100})
        const month = Math.floor(Math.random() * 12) + 1
        for (let i = 0; i < month; i++) {
            await page.keyboard.press('ArrowDown', {delay: 100})
        }
        await page.keyboard.press('Tab', {delay: 100})
        const year = Math.floor(Math.random() * 30) + 1970
        if (debug) console.log('Birth:', day, month, year)
        await page.keyboard.type(year.toString(),{delay: 100})
        await page.locator('button[data-a-target="signup-phone-email-toggle"]').click({delay: 100})
        await page.locator('input[type="email"]').click({delay: 100})
        await page.keyboard.type(email,{delay: 100})
        await new Promise(resolve => setTimeout(resolve, 1000))
        await page.locator('button[data-a-target="passport-signup-button"]').click({delay: 100})
        if (debug) console.log('Sign Up')
        await new Promise(resolve => setTimeout(resolve, 5000))
        let captcha = await page.locator('iframe[title="Captcha Challenge"]').count()
        if (captcha) await handleCaptcha(page, apikey, debug)
        await new Promise(resolve => setTimeout(resolve, 3000))
        const subject = await emailPage.locator('.message--container').textContent()
        const code = subject.split(':')[1].split('–')[0].trim()
        if (debug) console.log('Verification code:', code)
        await new Promise(resolve => setTimeout(resolve, 1000))
        await page.keyboard.type(code, {delay: 100})
        await new Promise(resolve => setTimeout(resolve, 10000))
        await browser.close()
        if (debug) console.log('Registered Successfully', {email, username, password})
        return {email, username, password}
    } catch (error) {
        console.error(error)
        await browser.close()
    }
}

async function login(email, user, pass, apikey, debug = false) {
    if (!apikey) {
        console.error('No API key provided')
        return
    }
    const browser = await firefox.launch({ headless: true })
    try {
        const context = await browser.newContext({ locale: 'en-GB' })
        const page = await context.newPage()
        await page.goto(`https://www.twitch.tv/login`)
        if (debug) console.log('Log in...')
        await page.locator('input#login-username').click()
        await page.keyboard.type(user, {delay: 100})
        await page.keyboard.press('Tab', {delay: 100})
        await page.keyboard.type(pass,{delay: 100})
        await page.keyboard.press('Enter', {delay: 100})
        await new Promise(resolve => setTimeout(resolve, 5000))
        let captcha = await page.locator('iframe[title="Captcha Challenge"]').count()
        if (captcha) await handleCaptcha(page, apikey, debug)
        await new Promise(resolve => setTimeout(resolve, 3000))
        const emailPage = await context.newPage()
        if (debug) console.log('Wait for e-mail...')
        await emailPage.goto('https://embedded.cryptogmail.com/')
        await new Promise(resolve => setTimeout(resolve, 1000))
        await emailPage.locator('a.button--change').click()
        await emailPage.locator('input.new-email').fill(email.split('@')[0])
        await emailPage.locator('p.new-email-domain-text-js').evaluate((item, email) => item.textContent = `@${email.split('@')[1]}`, email)
        await emailPage.locator('a.button--change-email').click()
        await emailPage.locator(':nth-match(.message--container, 1)').click()
        const code = await emailPage.locator('.header-message-code').textContent()
        if (debug) console.log('Verification code', code)
        await page.keyboard.type(code, {delay: 100})
        await new Promise(resolve => setTimeout(resolve, 10000))
        const cookies = await context.cookies('https://www.twitch.tv/')
        const authToken = cookies.find(cookie => cookie.name === 'auth-token').value
        if (debug) console.log('Auth token:', authToken)
        await browser.close()
        return authToken
    } catch (error) {
        console.error(error)
        await browser.close()
    }
}

module.exports = { signup, login }
