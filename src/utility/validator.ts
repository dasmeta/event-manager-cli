import {FunctionItem} from '../interfaces'

/**
 * Function name must
 *  - contain only
 *     - lower case Latin letters
 *     - digits
 *     - hyphen (-)
 *  - start with letter
 *  - not end with a hyphen
 *  - be at most 63 characters long
 *
 * @param name
 * @returns {boolean}
 *
 * @todo define interfaces
 */
const validateName = (name:string) => {
  let isValid = true
  const err = []
  const war = []

  if (name.length > 63 || name.length <= 3) {
    isValid = false
    err.push(`Function name's must be [3-63] characters long. Length: ${name.length}`)
  }

  if (name.length === 63) {
    war.push("Function name's must be at most 63 characters long. You are in edge.")
  }

  const fissionNameRegex =  /^[a-z0-9][a-z0-9\-]*[a-z0-9]$/g
  if (!fissionNameRegex.test(name)) {
    isValid = false
    err.push('Name must consist of lower case alphanumeric characters or \'-\', and must start and end with an alphanumeric character')
  }

  if (isValid) {
    if (war.length > 0) {
      console.log('\u001B[33m', '✓', name, '\u001B[0m')
    }
  } else {
    console.log('\u001B[31m', '✘', name, '\u001B[0m')
  }

  for (const [i, log] of err.entries())  console.log('\u001B[31m', ' ', log, '\u001B[0m')
  for (const [i, log] of war.entries())  console.log('\u001B[33m', ' ', log, '\u001B[0m')
  return isValid
}

export {
  validateName,
}
