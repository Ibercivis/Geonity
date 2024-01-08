import React, {useEffect, useState} from 'react';
import {View} from 'react-native';
import Wave from 'react-native-waveview';
import {RFPercentage} from 'react-native-responsive-fontsize';

interface Props {
  isAnimated?: boolean;
}

const WaveBackground = ({isAnimated = false}: Props) => {
  const [marginHorizontal, setMarginHorizontal] = useState(-28); //-28 el estable

  return (
    <>
      {isAnimated ? (
        <View
          style={{
            flex: 1,
            marginVertical: 0,
            marginHorizontal: RFPercentage(-28), //-88
            backgroundColor: 'transparent',
          }}>
          <Wave
            style={{flex: 1}}
            H={RFPercentage(6)}
            waveParams={[
              {A: RFPercentage(9), T: RFPercentage(60), fill: '#FFF'},
            ]}
            animated={false}
          />
        </View>
      ) : (
        <View
          style={{
            flex: 1,
            marginVertical: 0,
            marginHorizontal: RFPercentage(marginHorizontal), //-88
            backgroundColor: 'transparent',
          }}>
          <Wave
            style={{flex: 1}}
            H={RFPercentage(6)}
            waveParams={[
              {A: RFPercentage(9), T: RFPercentage(60), fill: '#FFF'},
            ]}
            animated={false}
          />
        </View>
      )}
    </>
  );
};
export default WaveBackground;

// import React from 'react';
// import {View} from 'react-native';
// import Svg, {Path} from 'react-native-svg';
// const WaveBackground = () => {
//   return (
//     <View style={{flex: 1}}>

//       <Svg
//         height="100"
//         width="100%"
//         viewBox="0 0 100 100"
//         preserveAspectRatio="none">

//         <Path
//           d="M0 -10 C -10 30, 50 30, 50 10 C 50 30, 80 30, 100 10 L 100 100 L 0 100 Z"
//           fill="#e20000"
//         />
//       </Svg>
//     </View>
//   );
// };
// export default WaveBackground;
