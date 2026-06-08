import { Given, When, Then } from '@cucumber/cucumber'
import { DataTable } from '@cucumber/cucumber'
import { buildFromSchema, assertResponse, ScenarioWorld } from 'cucumber-express'

Given('I build a {word} from schema with:', function (this: ScenarioWorld, name: string, dataTable: DataTable) {
  this.request = buildFromSchema(name, dataTable, this)
})

When('I post the request to {string}', async function (this: ScenarioWorld, path: string) {
  const res = await fetch(`https://dummyjson.com${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(this.request),
  })
  this.response = await res.json()
})

When('I fetch {int} products', async function (this: ScenarioWorld, limit: number) {
  const res = await fetch(`https://dummyjson.com/products?limit=${limit}&select=id,title,price,category`)
  this.response = await res.json()
})

Then('the response should match:', function (this: ScenarioWorld, dataTable: DataTable) {
  assertResponse(dataTable, this.response, this)
})
