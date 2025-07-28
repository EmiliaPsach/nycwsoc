import { StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows, layout } from './theme';

export const globalStyles = StyleSheet.create({
  // Container Styles
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
  },
  
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.main,
  },
  
  scrollContainer: {
    flexGrow: 1,
    padding: spacing.xl,
  },
  
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  
  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingText: {
    fontSize: typography.size.lg,
    color: colors.text.secondary,
  },
  
  // Error States
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  
  errorText: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  
  // Empty States
  emptyState: {
    alignItems: 'center',
    padding: spacing.xxxxl,
  },
  
  emptyText: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
    marginBottom: spacing.lg,
  },
});

export const buttonStyles = StyleSheet.create({
  // Primary Button
  primary: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    ...shadows.button,
  },
  
  primaryText: {
    color: colors.text.inverse,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semiBold,
  },
  
  // Secondary Button
  secondary: {
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    ...shadows.button,
  },
  
  secondaryText: {
    color: colors.primary,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semiBold,
  },
  
  // Danger Button
  danger: {
    backgroundColor: colors.danger,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    ...shadows.button,
  },
  
  dangerText: {
    color: colors.text.inverse,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semiBold,
  },
  
  // Small Button
  small: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  
  smallText: {
    color: colors.text.inverse,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semiBold,
  },
  
  // Disabled Button
  disabled: {
    opacity: 0.7,
  },
});

export const cardStyles = StyleSheet.create({
  // Standard Card
  card: {
    backgroundColor: colors.background.card,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  
  // Compact Card
  compactCard: {
    backgroundColor: colors.background.card,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.card,
  },
  
  // Large Card
  largeCard: {
    backgroundColor: colors.background.card,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    ...shadows.card,
  },
  
  // Stat Card
  statCard: {
    flex: 1,
    backgroundColor: colors.background.card,
    padding: spacing.xl,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
    alignItems: 'center',
    ...shadows.card,
  },
});

export const headerStyles = StyleSheet.create({
  // Page Header
  header: {
    backgroundColor: colors.background.card,
    paddingTop: spacing.xxxxxl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.medium,
  },
  
  headerTitle: {
    fontSize: typography.size.xxxl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  
  headerSubtitle: {
    fontSize: typography.size.lg,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  
  sectionTitle: {
    fontSize: typography.size.xxl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  
  sectionAction: {
    fontSize: typography.size.md,
    color: colors.primary,
    fontWeight: typography.weight.semiBold,
  },
  
  // Welcome Header (Home Screen)
  welcomeHeader: {
    padding: spacing.xl,
    paddingTop: spacing.xxxxl,
  },
  
  welcomeText: {
    fontSize: typography.size.xl,
    color: colors.text.secondary,
  },
  
  welcomeUserName: {
    fontSize: typography.size.xxxl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
});

export const formStyles = StyleSheet.create({
  // Form Container
  form: {
    marginBottom: spacing.xxxl,
  },
  
  // Input Container
  inputContainer: {
    marginBottom: spacing.xl,
  },
  
  // Label
  label: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semiBold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  
  // Input Field
  input: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    fontSize: typography.size.md,
    backgroundColor: colors.background.card,
    color: colors.text.primary,
  },
  
  // Input Error State
  inputError: {
    borderColor: colors.danger,
  },
  
  // Textarea
  textarea: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    fontSize: typography.size.md,
    backgroundColor: colors.background.card,
    color: colors.text.primary,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  
  // Picker Container
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.card,
    overflow: 'hidden',
  },
});

export const listStyles = StyleSheet.create({
  // List Item
  listItem: {
    backgroundColor: colors.background.card,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    ...shadows.card,
  },
  
  // List Item Title
  listItemTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  
  // List Item Subtitle
  listItemSubtitle: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  
  // List Item Meta
  listItemMeta: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
  },
  
  // Separator
  separator: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.sm,
  },
});

export const modalStyles = StyleSheet.create({
  // Modal Overlay
  overlay: {
    flex: 1,
    backgroundColor: colors.background.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Modal Container
  container: {
    backgroundColor: colors.background.card,
    margin: spacing.xl,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    ...shadows.modal,
    maxHeight: '80%',
  },
  
  // Modal Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  
  // Modal Title
  title: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  
  // Modal Close Button
  closeButton: {
    padding: spacing.sm,
  },
  
  // Modal Content
  content: {
    flex: 1,
  },
  
  // Modal Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
});

export const textStyles = StyleSheet.create({
  // Title
  title: {
    fontSize: typography.size.xxxl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
  },
  
  // Subtitle
  subtitle: {
    fontSize: typography.size.lg,
    color: colors.text.secondary,
  },
  
  // Body Text
  body: {
    fontSize: typography.size.md,
    color: colors.text.primary,
    lineHeight: typography.size.md * typography.lineHeight.normal,
  },
  
  // Caption
  caption: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
  
  // Small Text
  small: {
    fontSize: typography.size.xs,
    color: colors.text.tertiary,
  },
  
  // Link Text
  link: {
    fontSize: typography.size.md,
    color: colors.primary,
    fontWeight: typography.weight.semiBold,
  },
  
  // Emphasized Text
  emphasized: {
    fontSize: typography.size.md,
    color: colors.primary,
    fontWeight: typography.weight.bold,
  },
  
  // Center Text
  center: {
    textAlign: 'center',
  },
  
  // Right Aligned Text
  right: {
    textAlign: 'right',
  },
});

export const statusStyles = StyleSheet.create({
  // Status Badge Base
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  
  // Status Text Base
  badgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semiBold,
    textTransform: 'uppercase',
  },
  
  // Scheduled Status
  scheduled: {
    backgroundColor: colors.status.scheduled,
  },
  
  scheduledText: {
    color: colors.text.inverse,
  },
  
  // In Progress Status
  inProgress: {
    backgroundColor: colors.status.inProgress,
  },
  
  inProgressText: {
    color: colors.text.inverse,
  },
  
  // Completed Status
  completed: {
    backgroundColor: colors.status.completed,
  },
  
  completedText: {
    color: colors.text.inverse,
  },
  
  // Cancelled Status
  cancelled: {
    backgroundColor: colors.status.cancelled,
  },
  
  cancelledText: {
    color: colors.text.inverse,
  },
});

export const pollStyles = StyleSheet.create({
  pollQuestion: {
    fontSize: typography.size.md,
    color: colors.text.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  
  pollOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  
  pollOption: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border.medium,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  
  selectedPollOption: {
    borderColor: colors.primary,
    backgroundColor: '#F0F8FF',
  },
  
  pollOptionText: {
    fontSize: typography.size.md,
    color: colors.text.primary,
    fontWeight: typography.weight.medium,
  },
  
  selectedPollOptionText: {
    color: colors.primary,
    fontWeight: typography.weight.bold,
  },
  
  responseConfirmation: {
    fontSize: typography.size.sm,
    color: colors.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    fontWeight: typography.weight.medium,
  },
  
  pollClosed: {
    fontSize: typography.size.md,
    color: colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: spacing.xl,
  },
  
  pollResults: {
    borderTopWidth: 1,
    borderTopColor: colors.border.medium,
    paddingTop: spacing.xl,
  },
  
  pollResultsTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  
  pollStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  
  pollStat: {
    alignItems: 'center',
  },
  
  pollStatNumber: {
    fontSize: typography.size.xxxl,
    fontWeight: typography.weight.bold,
  },
  
  pollStatLabel: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  
  pollProgress: {
    alignItems: 'center',
  },
  
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.border.medium,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  
  progressFill: {
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  
  progressText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
  },
});

export const gameDetailStyles = StyleSheet.create({
  gameHeader: {
    backgroundColor: colors.background.card,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  
  weekText: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    fontWeight: typography.weight.medium,
  },
  
  matchup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  
  teamContainer: {
    flex: 1,
    alignItems: 'center',
  },
  
  teamName: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  
  userTeamName: {
    color: colors.primary,
  },
  
  teamLabel: {
    fontSize: typography.size.xs,
    color: colors.text.secondary,
    fontWeight: typography.weight.medium,
  },
  
  scoreSection: {
    paddingHorizontal: spacing.xl,
  },
  
  finalScore: {
    fontSize: 36,
    fontWeight: typography.weight.bold,
    color: colors.primary,
    textAlign: 'center',
  },
  
  vsText: {
    fontSize: 24,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  
  section: {
    backgroundColor: colors.background.card,
    marginBottom: spacing.xl,
    padding: spacing.xl,
  },
  
  sectionTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  
  infoGrid: {
    marginBottom: spacing.xl,
  },
  
  infoItem: {
    marginBottom: spacing.md,
  },
  
  infoLabel: {
    fontSize: typography.size.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  
  infoValue: {
    fontSize: typography.size.md,
    color: colors.text.primary,
    fontWeight: typography.weight.medium,
  },
  
  shareButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  
  shareButtonText: {
    color: colors.text.inverse,
    fontSize: typography.size.md,
    fontWeight: typography.weight.semiBold,
  },
  
  actionButton: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  
  actionButtonText: {
    fontSize: typography.size.md,
    color: colors.primary,
    fontWeight: typography.weight.medium,
  },
});