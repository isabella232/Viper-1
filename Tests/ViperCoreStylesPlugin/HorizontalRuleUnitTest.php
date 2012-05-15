<?php

require_once 'AbstractViperUnitTest.php';

class Viper_Tests_ViperCoreStylesPlugin_HorizontalRuleUnitTest extends AbstractViperUnitTest
{

    /**
     * Test that you can add a horizontal rule at the end of a paragraph.
     *
     * @return void
     */
    public function testAddingHorizontalRuleAtEndOfParagraph()
    {
        $this->selectText('WoW');
        $this->type('Key.RIGHT');

        $this->clickTopToolbarButton('insertHr');

        $this->type('Key.RIGHT');
        $this->type('Key.BACKSPACE');
        $this->type('This is a new line of ConTenT');

        $this->assertHTMLMatch('<h1>First HEADING</h1><p>Lorem XuT dolor sit <em>amet</em> <strong>WoW</strong></p><hr /><p>This is a new line of ConTenT</p><h2>Second heading</h2><p>This is another paragraph</p><ul><li>Test removing bullet points</li><li>purus oNo luctus</li><li>vel molestie arcu</li></ul>');

    }//end testAddingHorizontalRuleAtEndOfParagraph()


    /**
     * Test that you can add and delete a horizontal rule at the end of a paragraph.
     *
     * @return void
     */
    public function testAddingAndDeletingAHorizontalRuleAtEndOfParagraph()
    {
        $this->selectText('WoW');
        $this->type('Key.RIGHT');

        $this->clickTopToolbarButton('insertHr');

        $this->type('Key.RIGHT');
        $this->type('Key.BACKSPACE');
        $this->type('THIS is a new line of ConTenT');

        $this->assertHTMLMatch('<h1>First HEADING</h1><p>Lorem XuT dolor sit <em>amet</em> <strong>WoW</strong></p><hr /><p>THIS is a new line of ConTenT</p><h2>Second heading</h2><p>This is another paragraph</p><ul><li>Test removing bullet points</li><li>purus oNo luctus</li><li>vel molestie arcu</li></ul>');

        $this->selectText('THIS');
        $this->type('Key.LEFT');
        $this->type('Key.BACKSPACE');

        $this->assertHTMLMatch('<h1>First HEADING</h1><p>Lorem XuT dolor sit <em>amet</em> <strong>WoW</strong></p><p>THIS is a new line of ConTenT</p><h2>Second heading</h2><p>This is another paragraph</p><ul><li>Test removing bullet points</li><li>purus oNo luctus</li><li>vel molestie arcu</li></ul>');

    }//end testAddingAndDeletingAHorizontalRuleAtEndOfParagraph()


    /**
     * Test that you can add a horizontal rule at the middle of a paragraph.
     *
     * @return void
     */
    public function testAddingHorizontalRuleInMiddleOfParagraph()
    {
        $this->selectText('XuT');
        $this->type('Key.RIGHT');

        $this->clickTopToolbarButton('insertHr');

        $this->type('New ConTenT');

        $this->assertHTMLMatch('<h1>First HEADING</h1><p>Lorem XuT</p><hr /><p>New ConTenTdolor sit <em>amet</em> <strong>WoW</strong></p><h2>Second heading</h2><p>This is another paragraph</p><ul><li>Test removing bullet points</li><li>purus oNo luctus</li><li>vel molestie arcu</li></ul>');

    }//end testAddingHorizontalRuleInMiddleOfParagraph()


    /**
     * Test that you can add a horizontal rule at the start of a paragraph.
     *
     * @return void
     */
    public function testAddingHorizontalRuleAtStartOfParagraph()
    {
        $this->selectText('Lorem');
        $this->type('Key.LEFT');

        $this->clickTopToolbarButton('insertHr');

        $this->type('New ConTenT');

        $this->assertHTMLMatch('<h1>First HEADING</h1><hr /><p>New ConTenTLorem XuT dolor sit <em>amet</em> <strong>WoW</strong></p><h2>Second heading</h2><p>This is another paragraph</p><ul><li>Test removing bullet points</li><li>purus oNo luctus</li><li>vel molestie arcu</li></ul>');

    }//end testAddingHorizontalRuleAtStartOfParagraph()


    /**
     * Test that you can add a horizontal rule at the start of a paragraph that has no inner tags.
     *
     * @return void
     */
    public function testAddingHorizontalRuleAtStartOfParagraphWithNoInnerTags()
    {
        $this->selectText('Lorem');
        $this->selectInlineToolbarLineageItem(0);
        $this->keyDown('Key.CMD + b');
        $this->keyDown('Key.CMD + b');
        $this->keyDown('Key.CMD + i');
        $this->keyDown('Key.CMD + i');
        $this->type('Key.LEFT');

        $this->clickTopToolbarButton('insertHr');

        $this->type('New ConTenT');

        $this->assertHTMLMatch('<h1>First HEADING</h1><hr /><p>New ConTenTLorem XuT dolor sit amet WoW</p><h2>Second heading</h2><p>This is another paragraph</p><ul><li>Test removing bullet points</li><li>purus oNo luctus</li><li>vel molestie arcu</li></ul>');

    }//end testAddingHorizontalRuleAtStartOfParagraph()


    /**
     * Test that you can add a horizontal rule after a heading.
     *
     * @return void
     */
    public function testAddingAndDeletingHorizontalRuleAfterHeading()
    {
        $this->selectText('HEADING');
        $this->type('Key.RIGHT');

        $this->clickTopToolbarButton('insertHr');

        $this->type('Key.RIGHT');
        $this->type('Key.BACKSPACE');
        $this->type('New ConTenT');

        $this->assertHTMLMatch('<h1>First HEADING</h1><hr /><p>New ConTenT</p><p>Lorem XuT dolor sit <em>amet</em> <strong>WoW</strong></p><h2>Second heading</h2><p>This is another paragraph</p><ul><li>Test removing bullet points</li><li>purus oNo luctus</li><li>vel molestie arcu</li></ul>');

        $this->selectText('New');
        $this->type('Key.LEFT');
        $this->type('Key.BACKSPACE');

        $this->assertHTMLMatch('<h1>First HEADING</h1><p>New ConTenT</p><p>Lorem XuT dolor sit <em>amet</em> <strong>WoW</strong></p><h2>Second heading</h2><p>This is another paragraph</p><ul><li>Test removing bullet points</li><li>purus oNo luctus</li><li>vel molestie arcu</li></ul>');

    }//end testAddingAndDeletingHorizontalRuleAfterHeading()


    /**
     * Test that you can add a horizontal rule in a list.
     *
     * @return void
     */
    public function testAddingAndRemovingHorizontalRuleInAList()
    {
        $this->selectText('oNo');
        $this->type('Key.RIGHT');

        $this->clickTopToolbarButton('insertHr');

        $this->type('New ConTenT');

        $this->assertHTMLMatch('<h1>First HEADING</h1><p>Lorem XuT dolor sit <em>amet</em> <strong>WoW</strong></p><h2>Second heading</h2><p>This is another paragraph</p><ul><li>Test removing bullet points</li><li>purus oNo</li><hr /><li>New ConTenTluctus</li><li>vel molestie arcu</li></ul>');

        $this->selectText('oNo');
        $this->type('Key.RIGHT');
        $this->type('Key.RIGHT');
        $this->type('Key.BACKSPACE');

        $this->assertHTMLMatch('<h1>First HEADING</h1><p>Lorem XuT dolor sit <em>amet</em> <strong>WoW</strong></p><h2>Second heading</h2><p>This is another paragraph</p><ul><li>Test removing bullet points</li><li>purus oNo</li><li>New ConTenTluctus</li><li>vel molestie arcu</li></ul>');

    }//end testAddingAndRemovingHorizontalRuleInAList()


    /**
     * Test adding a horizontal rule after formatted text.
     *
     * @return void
     */
    public function testAddingHorizontalRuleAfterFormattedText()
    {
        $this->selectText('XuT');
        $this->clickTopToolbarButton('subscript');

        $this->selectText('WoW');
        $this->clickTopToolbarButton('strikethrough');
        $this->keyDown('Key.RIGHT');
        $this->keyDown('Key.ENTER');
        $this->clickTopToolbarButton('insertHr');

        $this->assertHTMLMatch('<h1>First HEADING</h1><p>Lorem <sub>XuT</sub> dolor sit <em>amet</em> <strong><del>WoW</del></strong></p><p>&nbsp;</p><hr /><p>&nbsp;</p><h2>Second heading</h2><p>This is another paragraph</p><ul><li>Test removing bullet points</li><li>purus oNo luctus</li><li>vel molestie arcu</li></ul>');

    }//end testAddingHorizontalRuleAfterFormattedText()

}//end class


?>



