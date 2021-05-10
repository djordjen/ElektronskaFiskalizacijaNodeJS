const tools = require('../tools');

test('Function roundNo should round 1.567 to 1.57', () => {
    expect(tools.roundNo(1.567)).toBe(1.57);
})