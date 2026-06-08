import { ScenarioWorld } from 'cucumber-express'
import { setWorldConstructor } from '@cucumber/cucumber'

const World = await ScenarioWorld.withSchemas('schemas/**/*.feature')
setWorldConstructor(World)
