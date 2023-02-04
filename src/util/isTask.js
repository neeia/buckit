/**
 * @param {any} obj
 */
export default function isTask(obj) {
  return (obj
    && typeof obj === 'object'
    && obj.name !== undefined
    && obj.description !== undefined
    && obj.timestamp !== undefined
    && obj.completed !== undefined
  )
}