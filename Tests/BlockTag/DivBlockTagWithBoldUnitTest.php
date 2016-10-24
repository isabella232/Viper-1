<?php

require_once 'AbstractViperUnitTest.php';

class Viper_Tests_BlockTag_DivBlockTagWithBoldUnitTest extends AbstractViperUnitTest
{
    /**
     * Test adding bold formatting to content
     *
     * @return void
     */
    public function testAddingBoldFormattingToContent()
    {
        $this->useTest(1);
        $this->sikuli->execJS('viper.setSetting("defaultBlockTag", "DIV")');

        // Test applying bold formatting to one word using the inline toolbar
        $this->useTest(2);
        $this->selectKeyword(1);
        $this->clickInlineToolbarButton('bold');
        sleep(2);
        $this->assertHTMLMatch('<div>This is <strong>%1%</strong> %2% some content</div>');

        // Test applying bold formatting to one word using the top toolbar
        $this->useTest(2);
        sleep(2);
        $this->selectKeyword(1);
        $this->clickTopToolbarButton('bold');
        sleep(2);
        $this->assertHTMLMatch('<div>This is <strong>%1%</strong> %2% some content</div>');

        // Test applying bold formatting to one word using the keyboard shortcut
        $this->useTest(2);
        sleep(1);
        $this->selectKeyword(1);
        sleep(1);
        $this->sikuli->keyDown('Key.CMD + b');
        sleep(1);
        $this->assertHTMLMatch('<div>This is <strong>%1%</strong> %2% some content</div>');

        // Test applying bold formatting to multiple words using the inline toolbar
        $this->useTest(2);
        sleep(1);
        $this->selectKeyword(1, 2);
        sleep(1);
        $this->clickInlineToolbarButton('bold');
        sleep(1);
        $this->assertHTMLMatch('<div>This is <strong>%1% %2%</strong> some content</div>');

        // Test applying bold formatting to multiple words using the top toolbar
        $this->useTest(2);
        sleep(2);
        $this->selectKeyword(1, 2);
        sleep(1);
        $this->clickTopToolbarButton('bold');
        sleep(2);
        $this->assertHTMLMatch('<div>This is <strong>%1% %2%</strong> some content</div>');

        // Test applying bold formatting to multiple words using the keyboard shortcut
        $this->useTest(2);
        sleep(1);
        $this->selectKeyword(1, 2);
        sleep(1);
        $this->sikuli->keyDown('Key.CMD + b');
        sleep(1);
        $this->assertHTMLMatch('<div>This is <strong>%1% %2%</strong> some content</div>');

    }//end testAddingBoldFormattingToContent()


    /**
     * Test removing bold formatting from content
     *
     * @return void
     */
    public function testRemovingBoldFormatting()
    {
        $this->useTest(1);
        $this->sikuli->execJS('viper.setSetting("defaultBlockTag", "DIV")');

        // Test removing bold formatting from one word using the inline toolbar
        $this->useTest(3);
        $this->selectKeyword(1);
        $this->clickInlineToolbarButton('bold', 'active');
        $this->assertHTMLMatch('<div>This is %1% some content</div>');

        // Test removing bold formatting from one word using the top toolbar
        $this->useTest(3);
        $this->selectKeyword(1);
        $this->clickTopToolbarButton('bold', 'active');
        sleep(3);
        $this->assertHTMLMatch('<div>This is %1% some content</div>');

        // Test removing bold formatting from one word using the keyboard shortcut
        $this->useTest(3);
        $this->selectKeyword(1);
        $this->sikuli->keyDown('Key.CMD + b');
        $this->assertHTMLMatch('<div>This is %1% some content</div>');

        // Test removing bold formatting from multiple words using the inline toolbar
        $this->useTest(4);
        $this->selectKeyword(2);
        $this->selectInlineToolbarLineageItem(1);
        $this->clickInlineToolbarButton('bold', 'active');
        $this->assertHTMLMatch('<div>Some %1% bold %2% content %3% to test %4% more %5% content</div>');

        // Test removing bold formatting from multiple words using the top toolbar
        $this->useTest(4);
        $this->selectKeyword(2);
        $this->selectInlineToolbarLineageItem(1);
        $this->clickTopToolbarButton('bold', 'active');
        $this->assertHTMLMatch('<div>Some %1% bold %2% content %3% to test %4% more %5% content</div>');

        // Test removing bold formatting from multiple words using the keyboard shortcut
        $this->useTest(4);
        $this->selectKeyword(2);
        $this->selectInlineToolbarLineageItem(1);
        $this->sikuli->keyDown('Key.CMD + b');
        $this->assertHTMLMatch('<div>Some %1% bold %2% content %3% to test %4% more %5% content</div>');

        // Test removing bold formatting from all content using inline toolbar
        $this->useTest(5);
        $this->selectKeyword(1);
        $this->selectInlineToolbarLineageItem(1);
        $this->clickInlineToolbarButton('bold', 'active');
        $this->assertHTMLMatch('<div>Bold %1% content</div>');

        // Test removing bold formatting from all content using top toolbar
        $this->useTest(5);
        $this->selectKeyword(1);
        $this->selectInlineToolbarLineageItem(0);
        $this->clickTopToolbarButton('bold', 'active');
        $this->assertHTMLMatch('<div>Bold %1% content</div>');

        // Test removing bold formatting from all content using the keyboard shortcut
        $this->useTest(5);
        $this->selectKeyword(1);
        $this->selectInlineToolbarLineageItem(0);
        $this->sikuli->keyDown('Key.CMD + b');
        $this->assertHTMLMatch('<div>Bold %1% content</div>');

    }//end testRemovingBoldFormatting()


    /**
     * Test editing bold content
     *
     * @return void
     */
    public function testEditingBoldContent()
    {
        $this->useTest(1);
        $this->sikuli->execJS('viper.setSetting("defaultBlockTag", "DIV")');

        // Test adding content before the start of the bold formatting
        $this->useTest(4);
        $this->moveToKeyword(2, 'right');
        $this->sikuli->keyDown('Key.LEFT');
        $this->sikuli->keyDown('Key.LEFT');
        $this->sikuli->keyDown('Key.LEFT');
        $this->type('test ');
        $this->assertHTMLMatch('<div>Some %1% bold test <strong>%2% content %3% to test %4%</strong> more %5% content</div>');

        // Test adding content in the middle of bold formatting
        $this->useTest(4);
        $this->moveToKeyword(2, 'right');
        $this->type(' test');
        $this->assertHTMLMatch('<div>Some %1% bold <strong>%2% test content %3% to test %4%</strong> more %5% content</div>');

        // Test adding content to the end of bold formatting
        $this->useTest(4);
        $this->moveToKeyword(4, 'left');
        $this->sikuli->keyDown('Key.RIGHT');
        $this->sikuli->keyDown('Key.RIGHT');
        $this->sikuli->keyDown('Key.RIGHT');
        $this->type(' test');
        $this->assertHTMLMatch('<div>Some %1% bold <strong>%2% content %3% to test %4% test</strong> more %5% content</div>');

        // Test highlighting some content in the strong tags and replacing it
        $this->useTest(4);
        $this->selectKeyword(3);
        $this->type('test');
        $this->assertHTMLMatch('<div>Some %1% bold <strong>%2% content test to test %4%</strong> more %5% content</div>');

        // Test highlighting the first word of the strong tags and replace it. Should stay in strong tag.
        $this->useTest(4);
        $this->selectKeyword(2);
        $this->type('test');
        $this->assertHTMLMatch('<div>Some %1% bold <strong>test content %3% to test %4%</strong> more %5% content</div>');

        // Test hightlighting the first word, pressing forward + delete and replace it. Should be outside the strong tag.
        $this->useTest(4);
        $this->selectKeyword(2);
        $this->sikuli->keyDown('Key.DELETE');
        $this->type('test');
        $this->assertHTMLMatch('<div>Some %1% bold test<strong> content %3% to test %4%</strong> more %5% content</div>');

        // Test highlighting the first word, pressing backspace and replace it. Should be outside the strong tag.
        $this->useTest(4);
        $this->selectKeyword(2);
        $this->sikuli->keyDown('Key.BACKSPACE');
        $this->type('test');
        $this->assertHTMLMatch('<div>Some %1% bold test<strong> content %3% to test %4%</strong> more %5% content</div>');

        // Test highlighting the last word of the strong tags and replace it. Should stay in strong tag.
        $this->useTest(4);
        $this->selectKeyword(4);
        $this->type('test');
        $this->assertHTMLMatch('<div>Some %1% bold <strong>%2% content %3% to test test</strong> more %5% content</div>');

        // Test highlighting the last word of the strong tags, pressing forward + delete and replace it. Should stay inside strong
        $this->useTest(4);
        $this->selectKeyword(4);
        $this->sikuli->keyDown('Key.DELETE');
        $this->type('test');
        $this->assertHTMLMatch('<div>Some %1% bold <strong>%2% content %3% to test test</strong> more %5% content</div>');

        // Test highlighting the last word of the strong tags, pressing backspace and replace it. Should stay inside strong.
        $this->useTest(4);
        $this->selectKeyword(4);
        $this->sikuli->keyDown('Key.BACKSPACE');
        $this->type('test');
        $this->assertHTMLMatch('<div>Some %1% bold <strong>%2% content %3% to test test</strong> more %5% content</div>');

        // Test selecting from before the strong tag to inside. New content should not be in bold.
        $this->useTest(4);
        $this->selectKeyword(1, 3);
        $this->type('test');
        $this->assertHTMLMatch('<div>Some test<strong> to test %4%</strong> more %5% content</div>');

        // Test selecting from after the strong tag to inside. New content should be in bold.
        $this->useTest(4);
        $this->selectKeyword(3, 5);
        $this->type('test');
        $this->assertHTMLMatch('<div>Some %1% bold <strong>%2% content test</strong> content</div>');

    }//end testEditingBoldContent()


    /**
     * Test deleting bold content
     *
     * @return void
     */
    public function testDeletingBoldContent()
    {
        $this->useTest(1);
        $this->sikuli->execJS('viper.setSetting("defaultBlockTag", "DIV")');

        // Test replacing bold content with new content with highlighting
        $this->useTest(4);
        $this->selectKeyword(2, 4);
        $this->type('test');
        $this->assertHTMLMatch('<div>Some %1% bold <strong>test</strong> more %5% content</div>');

        $this->useTest(4);
        $this->selectKeyword(2, 4);
        $this->sikuli->keyDown('Key.DELETE');
        $this->type('test');
        $this->assertHTMLMatch('<div>Some %1% bold test more %5% content</div>');

        $this->useTest(4);
        $this->selectKeyword(2, 4);
        $this->sikuli->keyDown('Key.BACKSPACE');
        $this->type('test');
        $this->assertHTMLMatch('<div>Some %1% bold test more %5% content</div>');

        // Test replacing bold content with new content when selecting one keyword and using the lineage
        $this->useTest(4);
        $this->selectKeyword(2);
        $this->selectInlineToolbarLineageItem(1);
        $this->type('test');
        $this->assertHTMLMatch('<div>Some %1% bold <strong>test</strong> more %5% content</div>');

        $this->useTest(4);
        $this->selectKeyword(2);
        $this->selectInlineToolbarLineageItem(1);
        $this->sikuli->keyDown('Key.DELETE');
        $this->type('test');
        $this->assertHTMLMatch('<div>Some %1% bold test more %5% content</div>');

        $this->useTest(4);
        $this->selectKeyword(2);
        $this->selectInlineToolbarLineageItem(1);
        $this->sikuli->keyDown('Key.BACKSPACE');
        $this->type('test');
        $this->assertHTMLMatch('<div>Some %1% bold test more %5% content</div>');

        // Test replacing all content
        $this->useTest(5);
        $this->selectKeyword(1);
        $this->selectInlineToolbarLineageItem(0);
        $this->type('test');
        $this->assertHTMLMatch('<div>test</div>');

    }//end testDeletingBoldContent()


    /**
     * Test splitting a bold section in content
     *
     * @return void
     */
    public function testSplittingBoldContent()
    {
        $this->useTest(1);
        $this->sikuli->execJS('viper.setSetting("defaultBlockTag", "DIV")');
        sleep(5);

        // Test pressing enter in the middle of bold content
        $this->useTest(4);
        $this->moveToKeyword(2, 'right');
        sleep(1);
        $this->sikuli->keyDown('Key.ENTER');
        sleep(1);
        $this->type('test');
        sleep(1);
         $this->assertHTMLMatch('<div>Some %1% bold <strong>%2%</strong></div><div><strong>test content %3% to test %4%</strong> more %5% content</div>');

        // Test pressing enter at the start of bold content
        $this->useTest(4);
        sleep(3);
        $this->moveToKeyword(2, 'left');
        sleep(3);
        $this->sikuli->keyDown('Key.ENTER');
        sleep(3);
        $this->type('test ');
        $this->assertHTMLMatch('<div>Some %1% bold</div><div><strong>test %2% content %3% to test %4%</strong> more %5% content</div>');
        $this->sikuli->keyDown('Key.LEFT');
        $this->sikuli->keyDown('Key.LEFT');
        $this->sikuli->keyDown('Key.LEFT');
        $this->sikuli->keyDown('Key.LEFT');
        $this->sikuli->keyDown('Key.LEFT');
        $this->sikuli->keyDown('Key.LEFT');
        $this->type('test');
        $this->assertHTMLMatch('<div>Some %1% bold test</div><div><strong>test %2% content %3% to test %4%</strong> more %5% content</div>');

        // Test pressing enter at the end of bold content
        $this->useTest(4);
        $this->moveToKeyword(4, 'right');
        $this->sikuli->keyDown('Key.ENTER');
        $this->type('test');
        $this->assertHTMLMatch('<div>Some %1% bold <strong>%2% content %3% to test %4%</strong></div><div>test more %5% content</div>');

    }//end testSplittingBoldContent()


     /**
     * Test undo and redo when applying bold content
     *
     * @return void
     */
    public function testUndoAndRedoWithApplyingBoldContent()
    {
        $this->useTest(1);
        $this->sikuli->execJS('viper.setSetting("defaultBlockTag", "DIV")');

        // Apply bold content
        $this->useTest(2);
        $this->selectKeyword(1);
        $this->clickInlineToolbarButton('bold');
        $this->assertHTMLMatch('<div>This is <strong>%1%</strong> %2% some content</div>');

        // Test undo and redo with top toolbar icons
        $this->clickTopToolbarButton('historyUndo');
        $this->assertHTMLMatch('<div>This is %1% %2% some content</div>');
        $this->clickTopToolbarButton('historyRedo');
        $this->assertHTMLMatch('<div>This is <strong>%1%</strong> %2% some content</div>');

        // Test undo and redo with keyboard shortcuts
        $this->sikuli->keyDown('Key.CMD + z');
        $this->assertHTMLMatch('<div>This is %1% %2% some content</div>');
        $this->sikuli->keyDown('Key.CMD + Key.SHIFT + z');
        $this->assertHTMLMatch('<div>This is <strong>%1%</strong> %2% some content</div>');

         // Apply bold content again
        $this->selectKeyword(2);
        $this->clickInlineToolbarButton('bold');
        $this->assertHTMLMatch('<div>This is <strong>%1%</strong> <strong>%2%</strong> some content</div>');

        // Test undo and redo with top toolbar icons
        $this->clickTopToolbarButton('historyUndo');
        $this->assertHTMLMatch('<div>This is <strong>%1%</strong> %2% some content</div>');
        $this->clickTopToolbarButton('historyRedo');
        $this->assertHTMLMatch('<div>This is <strong>%1%</strong> <strong>%2%</strong> some content</div>');

        // Test undo and redo with keyboard shortcuts
        $this->sikuli->keyDown('Key.CMD + z');
        $this->assertHTMLMatch('<div>This is <strong>%1%</strong> %2% some content</div>');
        $this->sikuli->keyDown('Key.CMD + Key.SHIFT + z');
        $this->assertHTMLMatch('<div>This is <strong>%1%</strong> <strong>%2%</strong> some content</div>');

    }//end testUndoAndRedoWithApplyingBoldContent()


    /**
     * Test undo and redo when editing bold content
     *
     * @return void
     */
    public function testUndoAndRedoWithEditingBoldContent()
    {
        $this->useTest(1);
        $this->sikuli->execJS('viper.setSetting("defaultBlockTag", "DIV")');

        // Add content to the middle of the bold content
        $this->useTest(4);
        $this->moveToKeyword(2, 'right');
        $this->type(' test');
        $this->assertHTMLMatch('<div>Some %1% bold <strong>%2% test content %3% to test %4%</strong> more %5% content</div>');

        // Test undo and redo with top toolbar icons
        $this->clickTopToolbarButton('historyUndo');
        $this->assertHTMLMatch('<div>Some %1% bold <strong>%2% content %3% to test %4%</strong> more %5% content</div>');
        $this->clickTopToolbarButton('historyRedo');
        $this->assertHTMLMatch('<div>Some %1% bold <strong>%2% test content %3% to test %4%</strong> more %5% content</div>');

        // Test undo and redo with keyboard shortcuts
        $this->sikuli->keyDown('Key.CMD + z');
        $this->assertHTMLMatch('<div>Some %1% bold <strong>%2% content %3% to test %4%</strong> more %5% content</div>');
        $this->sikuli->keyDown('Key.CMD + Key.SHIFT + z');
        $this->assertHTMLMatch('<div>Some %1% bold <strong>%2% test content %3% to test %4%</strong> more %5% content</div>');

        // Test deleting content and pressing undo
        $this->selectKeyword(3);
        $this->sikuli->keyDown('Key.DELETE');
        $this->assertHTMLMatch('<div>Some %1% bold <strong>%2% test content&nbsp;&nbsp;to test %4%</strong> more %5% content</div>');

        // Test undo and redo with top toolbar icons
        $this->clickTopToolbarButton('historyUndo');
        $this->assertHTMLMatch('<div>Some %1% bold <strong>%2% test content %3% to test %4%</strong> more %5% content</div>');
        $this->clickTopToolbarButton('historyRedo');
        $this->assertHTMLMatch('<div>Some %1% bold <strong>%2% test content&nbsp;&nbsp;to test %4%</strong> more %5% content</div>');

        // Test undo and redo with keyboard shortcuts
        $this->sikuli->keyDown('Key.CMD + z');
        $this->assertHTMLMatch('<div>Some %1% bold <strong>%2% test content %3% to test %4%</strong> more %5% content</div>');
        $this->sikuli->keyDown('Key.CMD + Key.SHIFT + z');
        $this->assertHTMLMatch('<div>Some %1% bold <strong>%2% test content&nbsp;&nbsp;to test %4%</strong> more %5% content</div>');

    }//end testUndoAndRedoWithEditingBoldContent()


}//end class
