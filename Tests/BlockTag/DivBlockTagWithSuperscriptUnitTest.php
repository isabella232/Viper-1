<?php

require_once 'AbstractViperUnitTest.php';

class Viper_Tests_BlockTag_DivBlockTagWithSuperscriptUnitTest extends AbstractViperUnitTest
{
    /**
     * Test adding superscript formatting to content
     *
     * @return void
     */
    public function testAddingSuperscriptFormattingToContent()
    {
        $this->useTest(1);
        $this->sikuli->execJS('viper.setSetting("defaultBlockTag", "DIV")');

        // Test applying superscript formatting to one word using the top toolbar
        $this->useTest(2);
        $this->selectKeyword(1);
        $this->clickTopToolbarButton('superscript');
        $this->assertHTMLMatch('<div>This is <sup>%1%</sup> %2% some content</div>');

        // Test applying superscript formatting to multiple words using the top toolbar
        $this->useTest(2);
        $this->selectKeyword(1, 2);
        $this->clickTopToolbarButton('superscript');
        $this->assertHTMLMatch('<div>This is <sup>%1% %2%</sup> some content</div>');

    }//end testAddingSuperscriptFormattingToContent()


    /**
     * Test removing superscript formatting from content
     *
     * @return void
     */
    public function testRemovingSuperscriptFormatting()
    {
        $this->useTest(1);
        $this->sikuli->execJS('viper.setSetting("defaultBlockTag", "DIV")');

        // Test removing superscript formatting from one word using the top toolbar
        $this->useTest(3);
        $this->selectKeyword(1);
        $this->clickTopToolbarButton('superscript', 'active');
        $this->assertHTMLMatch('<div>This is %1% some content</div>');

        // Test removing superscript formatting from multiple words using the top toolbar
        $this->useTest(4);
        $this->selectKeyword(1);
        $this->selectInlineToolbarLineageItem(1);
        $this->clickTopToolbarButton('superscript', 'active');
        $this->assertHTMLMatch('<div>Some superscript %1% %2% content to test</div>');

        // Test removing superscript formatting from all content using top toolbar
        $this->useTest(5);
        $this->selectKeyword(1);
        $this->selectInlineToolbarLineageItem(0);
        $this->clickTopToolbarButton('superscript', 'active');
        $this->assertHTMLMatch('<div>Superscript %1% content</div>');

    }//end testRemovingSuperscriptFormatting()


    /**
     * Test editing superscript content
     *
     * @return void
     */
    public function testEditingSuperscriptContent()
    {
        $this->useTest(1);
        $this->sikuli->execJS('viper.setSetting("defaultBlockTag", "DIV")');

        // Test adding content to the start of the superscript formatting
        $this->useTest(4);
        $this->moveToKeyword(1, 'right');
        $this->sikuli->keyDown('Key.LEFT');
        $this->sikuli->keyDown('Key.LEFT');
        $this->sikuli->keyDown('Key.LEFT');
        $this->type('test ');
        $this->assertHTMLMatch('<div>Some superscript test <sup>%1% %2%</sup> content to test</div>');

        // Test adding content in the middle of superscript formatting
        $this->moveToKeyword(1, 'right');
        $this->type(' test');
        $this->assertHTMLMatch('<div>Some superscript test <sup>%1% test %2%</sup> content to test</div>');

        // Test adding content to the end of superscript formatting
        $this->moveToKeyword(2, 'left');
        $this->sikuli->keyDown('Key.RIGHT');
        $this->sikuli->keyDown('Key.RIGHT');
        $this->sikuli->keyDown('Key.RIGHT');
        $this->type(' %3%');
        $this->assertHTMLMatch('<div>Some superscript test <sup>%1% test %2% %3%</sup> content to test</div>');

        // Test highlighting some content in the sup tags and replacing it
        $this->selectKeyword(2);
        $this->type('abc');
        $this->assertHTMLMatch('<div>Some superscript test <sup>%1% test abc %3%</sup> content to test</div>');

        $this->selectKeyword(1);
        $this->type('%1%');
        $this->assertHTMLMatch('<div>Some superscript test <sup>%1% test abc %3%</sup> content to test</div>');

        $this->selectKeyword(1);
        $this->sikuli->keyDown('Key.DELETE');
        $this->type('abc');
        $this->assertHTMLMatch('<div>Some superscript test abc<sup> test abc %3%</sup> content to test</div>');

        // Undo so we can test backspace
        $this->sikuli->keyDown('Key.CMD + z');

        $this->selectKeyword(1);
        $this->sikuli->keyDown('Key.BACKSPACE');
        $this->type('abc');
        $this->assertHTMLMatch('<div>Some superscript test abc<sup> test abc %3%</sup> content to test</div>');

        $this->selectKeyword(3);
        $this->sikuli->keyDown('Key.DELETE');
        $this->type('%1%');
        $this->assertHTMLMatch('<div>Some superscript test abc<sup> test abc %1%</sup> content to test</div>');

        $this->selectKeyword(1);
        $this->sikuli->keyDown('Key.BACKSPACE');
        $this->type('abc');
        $this->assertHTMLMatch('<div>Some superscript test abc<sup> test abc abc</sup> content to test</div>');

    }//end testEditingSuperscriptContent()


    /**
     * Test deleting superscript content
     *
     * @return void
     */
    public function testDeletingSuperscriptContent()
    {
        $this->useTest(1);
        $this->sikuli->execJS('viper.setSetting("defaultBlockTag", "DIV")');

        // Test replacing superscript content with new content with highlighting
        $this->useTest(4);
        $this->selectKeyword(1, 2);
        $this->type('test');
        $this->assertHTMLMatch('<div>Some superscript <sup>test</sup> content to test</div>');

        $this->useTest(4);
        $this->selectKeyword(1, 2);
        $this->sikuli->keyDown('Key.DELETE');
        $this->type('test');
        $this->assertHTMLMatch('<div>Some superscript test content to test</div>');

        $this->useTest(4);
        $this->selectKeyword(1, 2);
        $this->sikuli->keyDown('Key.BACKSPACE');
        $this->type('test');
        $this->assertHTMLMatch('<div>Some superscript test content to test</div>');

        // Test replacing superscript content with new content when selecting one keyword and using the lineage
        $this->useTest(4);
        $this->selectKeyword(1);
        $this->selectInlineToolbarLineageItem(1);
        $this->type('test');
        $this->assertHTMLMatch('<div>Some superscript <sup>test</sup> content to test</div>');

        $this->useTest(4);
        $this->selectKeyword(1);
        $this->selectInlineToolbarLineageItem(1);
        $this->sikuli->keyDown('Key.DELETE');
        $this->type('test');
        $this->assertHTMLMatch('<div>Some superscript test content to test</div>');

        $this->useTest(4);
        $this->selectKeyword(1);
        $this->selectInlineToolbarLineageItem(1);
        $this->sikuli->keyDown('Key.BACKSPACE');
        $this->type('test');
        $this->assertHTMLMatch('<div>Some superscript test content to test</div>');

        // Test replacing all content
        $this->useTest(5);
        $this->selectKeyword(1);
        $this->selectInlineToolbarLineageItem(0);
        $this->type('test');
        $this->assertHTMLMatch('<div>test</div>');

    }//end testDeletingSuperscriptContent()


    /**
     * Test splitting a superscript section in content
     *
     * @return void
     */
    public function testSplittingSuperscriptContent()
    {
        $this->useTest(1);
        $this->sikuli->execJS('viper.setSetting("defaultBlockTag", "DIV")');

        // Test pressing enter in the middle of superscript content
        $this->useTest(4);
        $this->moveToKeyword(1, 'right');
        $this->sikuli->keyDown('Key.ENTER');
        $this->type('test');
        $this->assertHTMLMatch('<div>Some superscript <sup>%1%</div><div>test %2%</sup> content to test</div>');

        // Test pressing enter at the start of superscript content
        $this->useTest(4);
        $this->moveToKeyword(1, 'left');
        $this->sikuli->keyDown('Key.ENTER');
        $this->type('test ');
        $this->assertHTMLMatch('<div>Some superscript </div><div><sup>test %1% %2%</sup> content to test</div>');
        $this->sikuli->keyDown('Key.LEFT');
        $this->sikuli->keyDown('Key.LEFT');
        $this->sikuli->keyDown('Key.LEFT');
        $this->sikuli->keyDown('Key.LEFT');
        $this->sikuli->keyDown('Key.LEFT');
        $this->sikuli->keyDown('Key.LEFT');
        $this->type(' test');
        $this->assertHTMLMatch('<div>Some superscript test</div><div><sup>test %1% %2%</sup> content to test</div>');

        // Test pressing enter at the end of superscript content
        $this->useTest(4);
        $this->moveToKeyword(2, 'right');
        $this->sikuli->keyDown('Key.ENTER');
        $this->type('test ');
        $this->assertHTMLMatch('<div>Some superscript <sup>%1% %2%</sup></div><div>test&nbsp;&nbsp;content to test</div>');

    }//end testSplittingSuperscriptContent()


    /**
     * Test undo and redo with superscript content
     *
     * @return void
     */
    public function testUndoAndRedoWithSuperscriptContent()
    {
        $this->useTest(1);
        $this->sikuli->execJS('viper.setSetting("defaultBlockTag", "DIV")');

        // Apply superscript content
        $this->useTest(2);
        $this->selectKeyword(1);
        $this->clickTopToolbarButton('superscript');
        $this->assertHTMLMatch('<div>This is <sup>%1%</sup> %2% some content</div>');

        // Test undo and redo with top toolbar icons
        $this->clickTopToolbarButton('historyUndo');
        $this->assertHTMLMatch('<div>This is %1% %2% some content</div>');
        $this->clickTopToolbarButton('historyRedo');
        $this->assertHTMLMatch('<div>This is <sup>%1%</sup> %2% some content</div>');

        // Test undo and redo with keyboard shortcuts
        $this->sikuli->keyDown('Key.CMD + z');
        $this->assertHTMLMatch('<div>This is %1% %2% some content</div>');
        $this->sikuli->keyDown('Key.CMD + Key.SHIFT + z');
        $this->assertHTMLMatch('<div>This is <sup>%1%</sup> %2% some content</div>');        

    }//end testUndoAndRedoWithSuperscriptContent()


}//end class