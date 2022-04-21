# 2captcha Twitch
Log in and Sign up on Twitch using  [2captcha](https://2captcha.com?from=2203166) API

## Usage

### Install

---

```
npm i 2captcha-twitch
```

---

### Log in

---

```js
const twitch = require('2captcha-twitch')

// Log In
twitch.login(
    email,
    username,
    password,
    apiKey,
    debug
)
    // Auth-token cookie value
    .then((res) => console.log(res))
```

* `email`: `string` twitch user e-mail
* `username`: `string` twitch username
* `password`: `string` twitch password
* `apikey`: `string` is your 2captcha API key
* `debug`: `(Optional) bool` debug mode

### Sign up

---

```js
const twitch = require('2captcha-twitch')

// Sign Up
twitch.signup(
    apiKey, 
    debug
)
    // Returns {email, username, password}
    .then(res => console.log(res))
```
* `apikey`: `string` is your 2captcha API key
* `debug`: `(Optional) bool` debug mode
---

<hr>
<div style="text-align: center">
<a href="https://www.buymeacoffee.com/ethanpc" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>
</div>