All of the CLI commands referenced in this documents will be run via `pnpm`, e.g., `pnpm psy sync`.

<!-- BEGIN:psychic-rules -->
<!-- Include any rule customizations below the END:psychic-rules marker. -->
<!-- The psychic rules will be replaced whenever `pnpm psy sync:ai-rules` is run. -->

# AGENTS.md

## Key CLI Commands

- `psy sync` - Automatically generate types, OpenAPI specs, and run `on('cli:sync'...` commands defined in initializers
- `psy db:migrate` - Run migrations, then sync
- `psy db:reset` - Drop, create and migrate the database, then sync
- `psy g:resource` - Generate a full resource (model, controller, serializer, routes)
- `psy g:model` - Generate a model
- `psy g:controller` - Generate a controller
- `psy g:migration` - Generate a migration (used to make database changes when not generating a model or a resource)
- `psy --help` - List all commands provided by `psy
- **CRITICAL: ALWAYS run `psy <command> --help` BEFORE running any generator command to verify the exact syntax and available options.**
- `uspec` - Run unit specs
- `fspec` - Run feature specs
- `build:spec` - Check for type errors
- `format` - Apply standard formatting
- `lint` - Check linting

## Generator Usage Rules

- **A generator must always be used** when creating:
  - New models (using the model generator, sti-child generator, or resource generator)
  - New controllers (using the resource generator or controller generator)
  - New migrations (using the model generator, resource generator, or migration generator)
- **Generator preference order**:
  - **Resource generator is preferred** over all other generators (except for the sti-child generator) when a model may be manipulated via HTTP requests to the web application
  - **STI-child generator** is used when generating STI child models that build on an existing STI base model
  - **Model generator (or sti-child generator)** is preferred over the migration generator when a new model is being generated
  - **Migration generator** is used to make database changes when not generating a model or a resource

## Adding Properties to Existing Models

- **Always use the migration generator** (`pnpm psy g:migration`) to create a migration for any database schema changes; although optimized for adding fields, the scaffolding can easily be modified to make other database changes as well, using either DreamMigrationHelpers or Kysely-native calls
- Prefer a DreamMigrationHelpers method over compound Kysely calls when DreamMigrationHelpers provides a relevant method
- After generating the migration, manually add the property declaration to the model file
- Example: To add a `timezone` field to User, run `pnpm psy g:migration add_timezone_to_users` then add `public timezone: DreamColumn<User, 'timezone'>` to the User model
- **CRITICAL: never modify an existing migration file that has already been merged into main**

## Generator Workflow

After a generator has run:

1. **Update the migration file as needed** (for example, to add `unique()` to any column)
2. **Run the migrations**: `pnpm psy db:migrate`
3. **If the generator was a resource generator**:
   - Update the generated controller spec first
   - Then update the corresponding generated controller
   - **Note**: Controller specs will hang if there is no response within a controller (the code for each controller action in the generated controller starts out commented out)
4. **Commit generated code as its own commit** with a commit message in the following format:
   - First line: Indicate what was generated (e.g., "Generate Room resource")
   -
   - "```console"
   - The exact generator command that was run
   - "```"
   - Example commit message:
     Generate Room resource

     ```console
     pnpm psy g:resource --sti-base-serializer --owning-model=Place v1/host/places/rooms Room type:enum:room_types:Bathroom,Bedroom,Kitchen,Den
     ```

## When to Run `pnpm psy sync`

- **Run `pnpm psy sync`** whenever any of the following are added or changed:
  - An association in a Dream model
  - A serializer
  - An OpenAPI decorator on a Controller action
  - A route
- **If, in a controller spec, there are type errors related to what types an endpoint accepts or returns**, this means that the OpenAPI shape is out of sync and `pnpm psy sync` needs to be run

## Naming Conventions

- **Generator commands**: Always use snake_case for column names in generator commands
  - Example: `pnpm psy g:model Stay Guest:belongs_to Place:belongs_to arrive_on:date depart_on:date adults:integer cubs:integer deleted_at:datetime:optional`
- **TypeScript model properties**: Always use camelCase in TypeScript code
  - Example: `arriveOn`, `departOn`, `deletedAt` (not `arrive_on`, `depart_on`, `deleted_at`)
- The generator automatically converts snake_case column names to camelCase in the generated TypeScript model files

## Running Specs

- **Run all unit specs**: `pnpm uspec`
- **Run all feature specs in a headless browser**: `pnpm fspec`
- **Run all feature specs in a visible browser**: `pnpm fspec:visible`
- **Run a specific spec file**: Include a path to an individual file, e.g.:
  - `pnpm uspec spec/unit/controllers/V1/Host/PlacesController.spec.ts`
- **Run only specific specs within a file**: Include `.only` on a `describe`, `context`, or `it` block to run only the specs in that block
  - Example: `it.only('returns the index of Places', async () => {`
- **Skip specific specs within a file**: Include `.skip` on a `describe`, `context`, or `it` block to skip the specs in that block
  - Example: `it.skip('returns the index of Places', async () => {`

## Date and Time Handling

- **Never, under any circumstances, use JavaScript's `Date` object** - always use Dream's date types instead
- Import `DateTime` and `CalendarDate` from `@rvoh/dream`
- **When the goal is a date with no time component, use `CalendarDate`** - refer to its TSDocs for available methods
- Use `DateTime` for datetime values (timestamps with time)
- Use `CalendarDate` for date-only values (no time component)
- Always use the features provided directly by the `DateTime` and `CalendarDate` classes
- Do not use `new Date()` anywhere in the codebase, even for intermediate calculations
- Refer to the TSDocs for `CalendarDate` and `DateTime` to understand their APIs - do not assume method names
- Example: `import { CalendarDate, DateTime } from '@rvoh/dream'`
- Example: `CalendarDate.today({ zone: 'America/New_York' })` to get today's date in a specific timezone


### STI Child Generator Tip

When generating an STI parent with a `type` enum, the enum values must match the STI child model names. Use the `--model-name` flag in the sti-child generator to control the model class name independently of the namespace path. Example:

```console
# generate the STI parent:
pnpm psy g:resource --sti-base-serializer --owning-model=Place v1/host/places/\{\}/rooms Room type:enum:room_types:Bathroom,Bedroom,Kitchen,Den,LivingRoom Place:belongs_to position:integer:optional deleted_at:datetime:optional

# generate an STI child:
pnpm psy g:sti-child --model-name=Kitchen Room/Kitchen extends Room appliances:enum\[\]:appliance_types:stove,oven,microwave,dishwasher
```

## Behavior-Driven Development (BDD)

- **We practice BDD, not TDD**: This means we focus our expectations on outcomes, not implementation
- **For code being added independently of a generator**: Always add a failing spec first, then add the code to make the spec pass
  -- Follow the red-green-refactor cycle: write failing test → implement code → refactor
  -- **Generated code is the only exception** to this rule, because the generators automatically create scaffolding for the specs and implementation at the same time

### Spec Organization and Structure

- **When spec'ing a function**: Only use `describe` for the outermost block (`describe('theFunctionName', () => {`) and use `context` blocks for setting up different state for different cases (a context block is only necessary to isolate different state)
- **When spec'ing a class**: Only use `describe` for the outermost block (`describe('ClassName', () => {`) and for each public method in that class (`describe('.staticMethodName', () => {` or `describe('#instanceMethodName', () => {`)) and use `context` blocks for setting up different state for different cases (a context block is only necessary to isolate different state)

### Spec Best Practices

- **Keep DRY with spec setup**: Leverage nested `context` blocks to change only the one thing being tested by that context
  - Example: If the effect of different `options`, is being spec'ed, define `let options: OptionInterface` in the `describe` block and set them to the happy path values in a `beforeEach` within that `describe` block, and only change one property in `options` in a `beforeEach` in each of the nested context blocks
  - The string label of the context block should indicate what is changing in that context, e.g. `context('when the color is red', () => {`)
- **Don't spec the behavior of another class that has already been spec'd**: When spec'ing a new class that relies on that other class, use a vitest spy to return different values in different `context` blocks instead
- **Never stub Dream internals**: Don't spy on Dream methods like `loaded` and try to mock the behavior
- **In controller specs, generally use factories to create real models and let controllers leverage Dream querying features (never mocked) to fetch those models**: Controllers usually use real Dream queries, not mocked data
  - **If a service class/function that is itself spec'd is used to fetch the data, or a view-model that is itself spec'd is used to transform the fetched data**: You might mock that, but you might also simply create data to satisfy the happy path and ensure that the specs for the service class/function or view-model is where the full variety of test cases are covered
- **Use Polly for external API calls**: Use Polly (see `setupPolly`) to record and replay external API calls rather than stubbing those calls
- **When testing soft deletes, follow BDD principles by testing behavior**: Test that the item has been deleted (normal query) and that it's still present when scopes are removed (including the soft delete scope)
  - Example:
    ```
      const placeQuery = Place.where({ id: place.id })
      expect(await placeQuery.exists()).toBe(false)
      expect(await placeQuery.removeAllDefaultScopes().exists()).toBe(true)
    ```

## Code Comments

- **Only use comments to explain "why", not "what"** - the implementation already shows what the code does, and comments explaining what are non-DRY and easily fall out of date
- **Prefer expressive code over comments** - if you find yourself writing a comment to explain what a line does, consider if the code can be made more expressive through better naming or extraction instead
- **TSDoc comments explaining "how" or "when" to use a function, method, or class are welcome**

## Troubleshooting Migrations

- **"Corrupted migrations" error**: When switching between branches with different migrations, or when a migration was removed during initial development (which is never allowed once a migration has been merged into the trunk), `pnpm psy db:migrate` fails with "corrupted migrations" errors. The fix is `pnpm psy db:reset`.

## STI Create Actions Must Use Switch on Child Model Classes

When creating an STI model in a controller, **never pass the raw `type` string to the base model's `create` method** (e.g., `Room.create({ type: 'Kitchen' })`). Even though it may appear to work at runtime, it:
1. Bypasses validators, setters, and lifecycle events on the intended model
2. Fails OpenAPI response validation: the base model's `create()` doesn't produce a properly typed STI child instance, so response serialization doesn't invoke the correct serializer

**Solution:** Use a switch statement on the validated type enum to instantiate the correct STI child class:

```ts
const type = this.castParam('type', 'string', { enum: RoomTypeEnumValues })
const params = this.paramsFor(Room)

let room: Room
switch (type) {
  case 'Bathroom':
    room = await Bathroom.create(params)
    break
  case 'Bedroom':
    room = await Bedroom.create(params)
    break
  case 'Kitchen':
    room = await Kitchen.create(params)
    break
  case 'Den':
    room = await Den.create(params)
    break
  default: {
    // protection so that if a new RoomTypesEnum is ever added, this will throw a type
    // error at build time until a case is added to handle that new RoomTypesEnum
    const _never: never = type
    // even though this should never happen due to the type protection, throw an error to satisfy later types
    throw new Error(`Unknown room type: ${_never}`)
  }
}
```

Key details:
- Use `this.castParam('type', 'string', { enum: RoomTypeEnumValues })` to validate and narrow the type
- The `const _never: never = type` pattern ensures exhaustive matching at compile time
- Each STI child class (e.g., `Kitchen`) has its own serializer that produces the correct OpenAPI schema shape


## Sources of Truth for Dream/Psychic Documentation

**CRITICAL: Never guess, assume, or invent method names, API patterns, or generator syntax.**

Dream and Psychic are large frameworks with many patterns, APIs, and conventions that may not be obvious or may differ from assumptions. Always consult authoritative sources in the following order:

### Primary Sources of Truth (in order of priority)

1. **TSDocs** - For method signatures, parameters, return types, and usage examples of functions and classes
   - Check TSDocs in your IDE or in the source code before using any Dream/Psychic API
   - TSDocs are the definitive source for "what arguments does this method take" and "what does this method return"

2. **`pnpm psy --help` and `pnpm psy <command> --help`** - For generator command syntax and available options
   - **ALWAYS run `pnpm psy <command> --help`** before using any generator to verify exact syntax
   - Do not rely on memory or assumptions about what flags or arguments are available

3. **psychic-skill** - For architectural patterns, best practices, and framework concepts
   - Query the psychic-skill for questions about "how should I structure this", "what pattern should I use", or "how does X work"
   - Use the psychic-skill to understand framework conventions and architectural decisions
   - The the psychic-skill server contains official Dream/Psychic documentation and examples

4. **MCP Server** - For architectural patterns, best practices, and framework concepts if the psychic-skill is not present or does not cover a specific API or concept
   - The mcp.json file in this project includes the "dream-psychic-rag", which includes documentation for Psychic web framework and Dream ORM
   - Query the MCP server for questions about "how should I structure this", "what pattern should I use", or "how does X work"
   - Use MCP to understand framework conventions and architectural decisions
   - The MCP server contains official Dream/Psychic documentation and examples


## Customizing These Rules

- **Any customizations to these rules must be added AFTER the `END:psychic-rules` marker**
- **Do not modify any content above that marker** - it will be replaced when `pnpm psy sync:ai-rules` is run
- **All project-specific customizations should be placed below the end marker**

<!-- END:psychic-rules -->

