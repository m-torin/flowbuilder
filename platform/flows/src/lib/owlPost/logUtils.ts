// logUtils.ts
export const logUtils = {
  stepStart: (step: string, data: any) => {
    console.log('\n🔵 START:', step);
    console.log('📥 Input:', JSON.stringify(data, null, 2));
  },

  stepEnd: (step: string, data: any) => {
    console.log('\n✅ END:', step);
    console.log('📤 Output:', JSON.stringify(data, null, 2));
  },

  error: (step: string, error: any) => {
    console.error('\n❌ ERROR:', step);
    console.error('💥 Details:', error);
  },

  transform: (nodeId: string, before: any, after: any) => {
    console.log('\n🔄 TRANSFORM:', nodeId);
    console.log('⬅️  Before:', JSON.stringify(before, null, 2));
    console.log('➡️  After:', JSON.stringify(after, null, 2));
  },

  state: (message: string, data: any) => {
    console.log('\n📊 STATE:', message);
    console.log(JSON.stringify(data, null, 2));
  },
};
