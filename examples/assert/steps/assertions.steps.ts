import { When, Then } from '@cucumber/cucumber'
import type { DataTable } from '@cucumber/cucumber'
import { assertResponse, ScenarioWorld } from 'cucumber-express'

When('I fetch product {int}', async function (this: ScenarioWorld, id: number) {
  const res = await fetch(`https://dummyjson.com/products/${id}`)
  this.response = await res.json()
})

When('I fetch beauty products', async function (this: ScenarioWorld) {
  const res = await fetch('https://dummyjson.com/products/category/beauty?limit=3')
  this.response = await res.json()
})

Then('the response should match:', function (this: ScenarioWorld, dataTable: DataTable) {
  assertResponse(dataTable, this.response, this)
})
