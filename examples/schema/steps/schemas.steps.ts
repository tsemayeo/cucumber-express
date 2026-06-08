import { When, Then } from '@cucumber/cucumber'
import { DataTable } from '@cucumber/cucumber'
import { buildFromSchema, assertResponse, ScenarioWorld } from 'cucumber-express'

When('I build a {word} from schema', function (this: ScenarioWorld, name: string) {
  this.request = buildFromSchema(name, new DataTable([]), this)
})

When('I build a {word} from schema with:', function (this: ScenarioWorld, name: string, dataTable: DataTable) {
  this.request = buildFromSchema(name, dataTable, this)
})

Then('the request should match:', function (this: ScenarioWorld, dataTable: DataTable) {
  assertResponse(dataTable, this.request, this)
})
