<?php

require_once 'AbstractViperUnitTest.php';

class Viper_Tests_ViperCoreStylesPlugin_BoldUnitTest extends AbstractViperUnitTest
{


    /**
     * Test that style can be applied to the selection at start of a paragraph.
     *
     * @return void
     */
    public function testStartOfParaBold()
    {
        $this->selectText('Lorem');

        $this->clickInlineToolbarButton(dirname(__FILE__).'/Images/toolbarIcon_bold.png');
        $this->assertTrue($this->inlineToolbarButtonExists(dirname(__FILE__).'/Images/toolbarIcon_bold_active.png'), 'Bold icon in the inline toolbar is not active');
        $this->assertTrue($this->topToolbarButtonExists(dirname(__FILE__).'/Images/toolbarIcon_bold_active.png'), 'Bold icon in the top toolbar is not active');

        $this->assertHTMLMatch('<p><strong>Lorem</strong> XuT dolor</p><p>sit <em>amet</em> <strong>WoW</strong></p>');

    }//end testStartOfParaBold()


    /**
     * Test that style can be applied to middle of a paragraph.
     *
     * @return void
     */
    public function testMidOfParaBold()
    {
        $this->selectText('XuT');

        $this->clickInlineToolbarButton(dirname(__FILE__).'/Images/toolbarIcon_bold.png');
        $this->assertTrue($this->inlineToolbarButtonExists(dirname(__FILE__).'/Images/toolbarIcon_bold_active.png'), 'Bold icon in the inline toolbar is not active');
        $this->assertTrue($this->topToolbarButtonExists(dirname(__FILE__).'/Images/toolbarIcon_bold_active.png'), 'Bold icon in the top toolbar is not active');

        $this->assertHTMLMatch('<p>Lorem <strong>XuT</strong> dolor</p><p>sit <em>amet</em> <strong>WoW</strong></p>');

    }//end testMidOfParaBold()


    /**
     * Test that style can be applied to the end of a paragraph.
     *
     * @return void
     */
    public function testEndOfParaBold()
    {
        $this->selectText('dolor');

        $this->clickInlineToolbarButton(dirname(__FILE__).'/Images/toolbarIcon_bold.png');
        $this->assertTrue($this->inlineToolbarButtonExists(dirname(__FILE__).'/Images/toolbarIcon_bold_active.png'), 'Bold icon in the inline toolbar is not active');
        $this->assertTrue($this->topToolbarButtonExists(dirname(__FILE__).'/Images/toolbarIcon_bold_active.png'), 'Bold icon in the top toolbar is not active');

        $this->assertHTMLMatch('<p>Lorem XuT <strong>dolor</strong></p><p>sit <em>amet</em> <strong>WoW</strong></p>');

    }//end testEndOfParaBold()


    /**
     * Test that bold is applied to two words and then removed from one word.
     *
     * @return void
     */
    public function testRemovingFormatFromPartOfTheContent()
    {
        $this->selectText('XuT', 'dolor');

        $this->clickInlineToolbarButton(dirname(__FILE__).'/Images/toolbarIcon_bold.png');
        $this->assertTrue($this->inlineToolbarButtonExists(dirname(__FILE__).'/Images/toolbarIcon_bold_active.png'), 'Bold icon in the inline toolbar is not active');
        $this->assertTrue($this->topToolbarButtonExists(dirname(__FILE__).'/Images/toolbarIcon_bold_active.png'), 'Bold icon in the top toolbar is not active');

        $this->assertHTMLMatch('<p>Lorem <strong>XuT dolor</strong></p><p>sit <em>amet</em> <strong>WoW</strong></p>');

        $this->selectText('dolor');

        $this->clickInlineToolbarButton(dirname(__FILE__).'/Images/toolbarIcon_bold_active.png');
        $this->assertTrue($this->inlineToolbarButtonExists(dirname(__FILE__).'/Images/toolbarIcon_bold.png'), 'Bold icon in the inline toolbar is still active');
        $this->assertTrue($this->topToolbarButtonExists(dirname(__FILE__).'/Images/toolbarIcon_bold.png'), 'Bold icon in the top toolbar is still active');

        $this->assertHTMLMatch('<p>Lorem <strong>XuT </strong>dolor</p><p>sit <em>amet</em> <strong>WoW</strong></p>');

        $this->selectText('XuT');
        $this->assertTrue($this->inlineToolbarButtonExists(dirname(__FILE__).'/Images/toolbarIcon_bold_active.png'), 'Bold icon in the inline toolbar is not active');
        $this->assertTrue($this->topToolbarButtonExists(dirname(__FILE__).'/Images/toolbarIcon_bold_active.png'), 'Bold icon in the top toolbar is not active');

    }//end testRemovingFormatFromPartOfTheContent()


    /**
     * Test that the shortcut command works for Bold.
     *
     * @return void
     */
    public function testShortcutCommand()
    {
        $this->selectText('Lorem');
        $this->keyDown('Key.CMD + b');

        $this->assertTrue($this->inlineToolbarButtonExists(dirname(__FILE__).'/Images/toolbarIcon_bold_active.png'), 'Bold icon in the inline toolbar is not active');
        $this->assertTrue($this->topToolbarButtonExists(dirname(__FILE__).'/Images/toolbarIcon_bold_active.png'), 'Bold icon in the top toolbar is not active');

        $this->assertHTMLMatch('<p><strong>Lorem</strong> XuT dolor</p><p>sit <em>amet</em> <strong>WoW</strong></p>');

        $this->selectText('Lorem');
        $this->keyDown('Key.CMD + b');

        $this->assertTrue($this->inlineToolbarButtonExists(dirname(__FILE__).'/Images/toolbarIcon_bold.png'), 'Bold icon in the inline toolbar is still active');
        $this->assertTrue($this->topToolbarButtonExists(dirname(__FILE__).'/Images/toolbarIcon_bold.png'), 'Bold icon in the top toolbar is still active');

        $this->assertHTMLMatch('<p>Lorem XuT dolor</p><p>sit <em>amet</em> <strong>WoW</strong></p>');

    }//end testShortcutCommand()


    /**
     * Test that a paragraph can be made bold using the top toolbar and that the VITP bold icon will appear when that happen. Then remove the bold formatting and check that the VITP bold icon is removed.
     *
     * @return void
     */
    public function testAddingAndRemovingFormattingToAParagraph()
    {
        $start = $this->find('Lorem');
        $end   = $this->find('dolor');
        $this->dragDrop($this->getTopLeft($start), $this->getTopRight($end));

        // Inline Toolbar icon should not be displayed.
        $this->assertFalse($this->inlineToolbarButtonExists(dirname(__FILE__).'/Images/toolbarIcon_bold.png'), 'Bold icon appears in the inline toolbar');
        $this->assertFalse($this->inlineToolbarButtonExists(dirname(__FILE__).'/Images/toolbarIcon_bold_active.png'), 'Bold icon appears in the inline toolbar and is active');

        // Click the Top Toolbar icon to make whole paragraph bold.
        $this->clickTopToolbarButton(dirname(__FILE__).'/Images/toolbarIcon_bold.png');

        $this->assertHTMLMatch('<p><strong>Lorem XuT dolor</strong></p><p>sit <em>amet</em> <strong>WoW</strong></p>');
        $this->assertTrue($this->topToolbarButtonExists(dirname(__FILE__).'/Images/toolbarIcon_bold_active.png'), 'Bold icon is not active in the top toolbar');

        // Inline Toolbar icon is now displayed
        $this->assertTrue($this->inlineToolbarButtonExists(dirname(__FILE__).'/Images/toolbarIcon_bold_active.png'), 'Active bold icon does not appear in the inline toolbar');

        //Remove bold formating
        $this->selectText('XuT');
        $this->selectInlineToolbarLineageItem(1);
        $this->clickInlineToolbarButton(dirname(__FILE__).'/Images/toolbarIcon_bold_active.png');

        $this->assertHTMLMatch('<p>Lorem XuT dolor</p><p>sit <em>amet</em> <strong>WoW</strong></p>');
        $this->assertTrue($this->topToolbarButtonExists(dirname(__FILE__).'/Images/toolbarIcon_bold.png'), 'Bold icon is still active in the top toolbar');

        // Inline Toolbar icon should not be displayed.
        $this->assertFalse($this->inlineToolbarButtonExists(dirname(__FILE__).'/Images/toolbarIcon_bold.png'), 'Bold icon still appears in the inline toolbar');
        $this->assertFalse($this->inlineToolbarButtonExists(dirname(__FILE__).'/Images/toolbarIcon_bold_active.png'), 'Active bold icon still appear in the inline toolbar');

    }//end testAddAndRemoveBoldToAParagraph()


    /**
     * Test that correct HTML is produced when adjacent words are styled.
     *
     * @return void
     */
    public function testAdjacentWordStyling()
    {
        $this->selectText('XuT');
        $this->keyDown('Key.CMD + b');

        $this->selectText('Lorem', 'XuT');
        $this->keyDown('Key.CMD + b');

        $this->selectText('XuT', 'dolor');
        $this->keyDown('Key.CMD + b');

        $this->assertHTMLMatch('<p><strong>Lorem XuT dolor</strong></p><p>sit <em>amet</em> <strong>WoW</strong></p>');

    }//end testAdjacentWordStyling()


    /**
     * Test that correct HTML is produced when words separated by space are styled.
     *
     * @return void
     */
    public function testSpaceSeparatedAdjacentWordStyling()
    {
        $this->selectText('XuT');
        $this->keyDown('Key.CMD + b');

        $this->selectText('Lorem');
        $this->keyDown('Key.CMD + b');

        $this->selectText('dolor');
        $this->keyDown('Key.CMD + b');

        $this->assertHTMLMatch('<p><strong>Lorem</strong> <strong>XuT</strong> <strong>dolor</strong></p><p>sit <em>amet</em> <strong>WoW</strong></p>');

    }//end testSpaceSeparatedAdjacentWordStyling()


    /**
     * Test that bold can be removed.
     *
     * @return void
     */
    public function testRemoveFormating()
    {
        $this->selectText('WoW');

        $this->clickInlineToolbarButton(dirname(__FILE__).'/Images/toolbarIcon_bold_active.png');
        $this->assertTrue($this->inlineToolbarButtonExists(dirname(__FILE__).'/Images/toolbarIcon_bold.png'), 'Bold icon is still active in the inline toolbar');
        $this->assertTrue($this->topToolbarButtonExists(dirname(__FILE__).'/Images/toolbarIcon_bold.png'), 'Bold icon is still active in the top toolbar');

        $this->assertHTMLMatch('<p>Lorem XuT dolor</p><p>sit <em>amet</em> WoW</p>');

    }//end testRemoveFormating()


    /**
     * Test that the Bold icons are active when you select a word that is bold.
     *
     * @return void
     */
    public function testIconsAreActive()
    {
        $this->selectText('WoW');

        $this->assertTrue($this->inlineToolbarButtonExists(dirname(__FILE__).'/Images/toolbarIcon_bold_active.png'), 'Bold icon is not active in the inline toolbar');
        $this->assertTrue($this->topToolbarButtonExists(dirname(__FILE__).'/Images/toolbarIcon_bold_active.png'), 'Bold icon is not active in the top toolbar');

    }//end testIconsAreActive()


    /**
     * Test that the VITP bold icon is removed from the toolbar when you click the P tag.
     *
     * @return void
     */
    public function testIconIsRemovedFromInlineToolbar()
    {
        $this->selectText('Lorem');

        // Inline Toolbar icon should be displayed.
        $this->assertTrue($this->inlineToolbarButtonExists(dirname(__FILE__).'/Images/toolbarIcon_bold.png'), 'Bold icon does not exist in the inline toolbar');

        // Click the P tag.
        $this->selectInlineToolbarLineageItem(0);

        // Inline Toolbar icon should not be displayed.
        $this->assertFalse($this->inlineToolbarButtonExists(dirname(__FILE__).'/Images/toolbarIcon_bold.png'), 'Bold icon still appears in the inline toolbar');

        // Click the Selection tag.
        $this->selectInlineToolbarLineageItem(1);

        // Inline Toolbar icon should be displayed.
        $this->assertTrue($this->inlineToolbarButtonExists(dirname(__FILE__).'/Images/toolbarIcon_bold.png'), 'Bold icon does appear in the inline toolbar');

    }//end testIconIsRemovedFromInlineToolbar()


}//end class

?>
