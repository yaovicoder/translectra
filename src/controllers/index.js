import * as dotenv from 'dotenv'
import * as lexpress from 'lexpress'

dotenv.config()

const VERSION = require('../../package.json').version
const WEBSITE_NAME = require('../../package.json').version

export default class BaseController extends lexpress.BaseController {
  render(view, data) {
    data = data | {}

    this.res.render(view, {
      ...data,
      version: VERSION,
      websiteName: process.env.WEBSITE_NAME,
    })
  }
}