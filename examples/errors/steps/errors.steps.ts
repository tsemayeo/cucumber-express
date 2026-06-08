import { Given, When, Then } from '@cucumber/cucumber'
import { DataTable } from '@cucumber/cucumber'
import { buildFromSchema, assertResponse, ScenarioWorld } from 'cucumber-express'

Given('I have a built Product', function (this: ScenarioWorld) {
  this.request = buildFromSchema('Product', new DataTable([]), this)
})

When('I try to build a {word} from schema', function (this: ScenarioWorld, name: string) {
  try {
    this.request = buildFromSchema(name, new DataTable([]), this)
    this.error = null
  } catch (e) {
    this.error = e instanceof Error ? e.message : String(e)
  }
})

When('I try to build a {word} from schema with:', function (this: ScenarioWorld, name: string, dataTable: DataTable) {
  try {
    this.request = buildFromSchema(name, dataTable, this)
    this.error = null
  } catch (e) {
    this.error = e instanceof Error ? e.message : String(e)
  }
})

When('I try to assert the request with:', function (this: ScenarioWorld, dataTable: DataTable) {
  try {
    assertResponse(dataTable, this.request, this)
    this.error = null
  } catch (e) {
    this.error = e instanceof Error ? e.message : String(e)
  }
})

Then('the error should contain {string}', function (this: ScenarioWorld, msg: string) {
  if (this.error === null) throw new Error(`Expected an error containing "${msg}" but no error was thrown`)
  if (!this.error.includes(msg)) throw new Error(`Expected error to contain "${msg}" but got:\n${this.error}`)
})
