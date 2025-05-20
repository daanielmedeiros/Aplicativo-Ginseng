import { StyleSheet } from 'react-native';
import Colors from './Colors';

/**
 * Common styles used throughout the app
 */
export const CommonStyles = StyleSheet.create({
  // Containers
  screen: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  
  // Typography
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
    lineHeight: 32,
    color: Colors.neutral[900],
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 18,
    lineHeight: 24,
    color: Colors.neutral[800],
    marginBottom: 8,
  },
  heading: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    lineHeight: 24,
    color: Colors.neutral[900],
    marginBottom: 8,
  },
  body: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 21,
    color: Colors.neutral[700],
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.neutral[700],
    marginBottom: 4,
  },
  caption: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 16,
    color: Colors.neutral[600],
  },
  
  // Form elements
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.neutral[900],
    backgroundColor: Colors.white,
    marginBottom: 16,
  },
  inputFocused: {
    borderColor: Colors.primary[500],
    borderWidth: 2,
  },
  inputError: {
    borderColor: Colors.error[500],
  },
  
  // Buttons
  buttonPrimary: {
    backgroundColor: Colors.primary[500],
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonSecondary: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.primary[500],
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.white,
  },
  buttonSecondaryText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.primary[500],
  },
  
  // Utility
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  mh8: { marginHorizontal: 8 },
  mv8: { marginVertical: 8 },
  mt16: { marginTop: 16 },
  mb16: { marginBottom: 16 },
  ml8: { marginLeft: 8 },
  
  // Status indicators
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  successBadge: {
    backgroundColor: Colors.success[50],
  },
  successText: {
    color: Colors.success[700],
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  warningBadge: {
    backgroundColor: Colors.warning[50],
  },
  warningText: {
    color: Colors.warning[700],
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  errorBadge: {
    backgroundColor: Colors.error[50],
  },
  errorText: {
    color: Colors.error[700],
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
});

export default CommonStyles;