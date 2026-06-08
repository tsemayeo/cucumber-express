import { Given, When, Then } from '@cucumber/cucumber'
import { DataTable } from '@cucumber/cucumber'
import { buildRequest, assertResponse, ScenarioWorld } from 'cucumber-express'

const customerSchema = () => ({
  name: '',
  email: '',
  role: 'member',
  age: 0,
  score: 0.0,
  active: false,
  tags: ['default'],
})

Given('my world captures {word} as {string}', function (this: ScenarioWorld, key: string, value: string) {
  this.captures.set(key, value)
})

When('I build a customer request with:', function (this: ScenarioWorld, dataTable: DataTable) {
  this.request = buildRequest(customerSchema, dataTable, this)
})

Then('the request should match:', function (this: ScenarioWorld, dataTable: DataTable) {
  assertResponse(dataTable, this.request, this)
})
