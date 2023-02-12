import { darkTheme, GlobalThemeOverrides } from 'naive-ui'
import { computed } from 'vue'
import { useColorScheme } from '../../hooks'
import colors from 'tailwindcss/colors'

export function useNaiveTheme () {
  const { colorScheme } = useColorScheme()
  const naiveTheme = computed(() => {
    return colorScheme.value === 'dark' ? darkTheme : null
  })
  return naiveTheme
}
const mainColors = {
  primaryColor: colors.sky['500'],
  primaryColorHover: colors.sky['400'],
  primaryColorPressed: colors.sky['600'],
  primaryColorSuppl: colors.sky['800'],
  infoColor: colors.sky['500'],
  infoColorHover: colors.sky['400'],
  infoColorPressed: colors.sky['600'],
  infoColorSuppl: colors.sky['800'],
  successColor: colors.green['600'],
  successColorHover: colors.green['500'],
  successColorPressed: colors.green['700'],
  successColorSuppl: colors.green['900'],
  warningColor: colors.amber['400'],
  warningColorHover: colors.amber['300'],
  warningColorPressed: colors.amber['500'],
  warningColorSuppl: colors.amber['700'],
  errorColor: colors.red['600'],
  errorColorHover: colors.red['500'],
  errorColorPressed: colors.red['700'],
  errorColorSuppl: colors.red['900']
}
export const themeOverrides: GlobalThemeOverrides = {
  common: {
    baseColor: '#fff',
    ...mainColors,
    // textColorBase: '#fff',
    textColor1: '#0f172a', // h标签的颜色
    textColor2: '#334155', // 正文颜色
    textColor3: '#94a3b8', // 次要文字颜色
    textColorDisabled: '#cbd5e1'
    // placeholderColor: '#cbd5e1'
    // placeholderColorDisabled: '',
    // iconColor: '',
    // iconColorHover: '',
    // iconColorPressed: '',
    // iconColorDisabled: '',
    // opacity1: '',
    // opacity2: '',
    // opacity3: '',
    // opacity4: '',
    // opacity5: '',
    // dividerColor: '',
    // borderColor: '',
    // closeIconColor: '',
    // closeIconColorHover: '',
    // closeIconColorPressed: '',
    // closeColorHover: '',
    // closeColorPressed: '',
    // clearColor: '',
    // clearColorHover: '',
    // clearColorPressed: '',
    // scrollbarColor: '',
    // scrollbarColorHover: '',
    // scrollbarWidth: '',
    // scrollbarHeight: '',
    // scrollbarBorderRadius: '',
    // progressRailColor: '',
    // railColor: '',
    // popoverColor: '',
    // tableColor: '',
    // cardColor: '',
    // modalColor: '',
    // bodyColor: '',
    // tagColor: '',
    // avatarColor: '',
    // invertedColor: '',
    // inputColor: '',
    // codeColor: '',
    // tabColor: '',
    // actionColor: '',
    // tableHeaderColor: '',
    // hoverColor: '',
    // tableColorHover: '',
    // tableColorStriped: '',
    // pressedColor: '',
    // opacityDisabled: '',
    // inputColorDisabled: '',
    // buttonColor2: '',
    // buttonColor2Hover: '',
    // buttonColor2Pressed: '',
    // boxShadow1: '',
    // boxShadow2: '',
    // boxShadow3: '',
    // fontFamily: '',
    // fontFamilyMono: '',
    // fontWeight: '',
    // fontWeightStrong: '',
    // cubicBezierEaseInOut: '',
    // cubicBezierEaseOut: '',
    // cubicBezierEaseIn: '',
    // borderRadius: '',
    // borderRadiusSmall: '',
    // fontSize: '',
    // fontSizeMini: '',
    // fontSizeTiny: '',
    // fontSizeSmall: '',
    // fontSizeMedium: '',
    // fontSizeLarge: '',
    // fontSizeHuge: '',
    // lineHeight: '',
    // heightMini: '',
    // heightTiny: '',
    // heightSmall: '',
    // heightMedium: '',
    // heightLarge: '',
    // heightHuge: ''
  },
  Button: {},
  Form: {
    labelTextColor: '#334155'
  }
}
export const themeOverridesDark: GlobalThemeOverrides = {
  common: {
    baseColor: '#fff',
    ...mainColors,
    // textColorBase: '#fff',
    textColor1: '#f1f5f9', // h标签的颜色
    textColor2: '#cbd5e1', // 正文颜色
    textColor3: '#64748b', // 次要文字颜色
    textColorDisabled: '#475569'
    // placeholderColor: '#334155'
    // placeholderColorDisabled: '',
    // iconColor: '',
    // iconColorHover: '',
    // iconColorPressed: '',
    // iconColorDisabled: '',
    // opacity1: '',
    // opacity2: '',
    // opacity3: '',
    // opacity4: '',
    // opacity5: '',
    // dividerColor: '',
    // borderColor: '',
    // closeIconColor: '',
    // closeIconColorHover: '',
    // closeIconColorPressed: '',
    // closeColorHover: '',
    // closeColorPressed: '',
    // clearColor: '',
    // clearColorHover: '',
    // clearColorPressed: '',
    // scrollbarColor: '',
    // scrollbarColorHover: '',
    // scrollbarWidth: '',
    // scrollbarHeight: '',
    // scrollbarBorderRadius: '',
    // progressRailColor: '',
    // railColor: '',
    // popoverColor: '',
    // tableColor: '',
    // cardColor: '',
    // modalColor: '',
    // bodyColor: '',
    // tagColor: '',
    // avatarColor: '',
    // invertedColor: '',
    // inputColor: '',
    // codeColor: '',
    // tabColor: '',
    // actionColor: '',
    // tableHeaderColor: '',
    // hoverColor: '',
    // tableColorHover: '',
    // tableColorStriped: '',
    // pressedColor: '',
    // opacityDisabled: '',
    // inputColorDisabled: '',
    // buttonColor2: '',
    // buttonColor2Hover: '',
    // buttonColor2Pressed: '',
    // boxShadow1: '',
    // boxShadow2: '',
    // boxShadow3: '',
    // fontFamily: '',
    // fontFamilyMono: '',
    // fontWeight: '',
    // fontWeightStrong: '',
    // cubicBezierEaseInOut: '',
    // cubicBezierEaseOut: '',
    // cubicBezierEaseIn: '',
    // borderRadius: '',
    // borderRadiusSmall: '',
    // fontSize: '',
    // fontSizeMini: '',
    // fontSizeTiny: '',
    // fontSizeSmall: '',
    // fontSizeMedium: '',
    // fontSizeLarge: '',
    // fontSizeHuge: '',
    // lineHeight: '',
    // heightMini: '',
    // heightTiny: '',
    // heightSmall: '',
    // heightMedium: '',
    // heightLarge: '',
    // heightHuge: ''
  },
  Button: {},
  Form: {
    labelTextColor: '#cbd5e1'
  }
}